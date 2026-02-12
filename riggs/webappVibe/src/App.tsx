import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

const FALLBACK_PALETTE = ["#00F5D4", "#00FF85", "#FFD500", "#FF6D00", "#FF00A8"];

type Direction = "up" | "down" | "left" | "right";
type PlayerId = "p1" | "p2";

type Vec = {
  x: number;
  y: number;
};

type PlayerState = {
  id: PlayerId;
  position: Vec;
  direction: Direction;
  nextDirection: Direction;
  trail: Vec[];
  alive: boolean;
  color: string;
};

type GamePhase = "idle" | "running" | "paused" | "round_over";

type RoundResult = {
  winner: PlayerId | "draw" | null;
  reason: string;
};

type PaletteResponse = {
  colors: Array<{ hex: { value: string } }>;
};

const GRID_WIDTH = 64;
const GRID_HEIGHT = 36;
const STEP_MS = 80;

const DIRECTIONS: Record<Direction, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toKey = (pos: Vec) => `${pos.x},${pos.y}`;

const hashStringToSeed = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColor = (a: string, b: string, t: number) => {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const bVal = parseInt(value.slice(4, 6), 16);
    return { r, g, b: bVal };
  };
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(mix(ca.r, cb.r, t));
  const g = Math.round(mix(ca.g, cb.g, t));
  const bVal = Math.round(mix(ca.b, cb.b, t));
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${bVal.toString(16).padStart(2, "0")}`;
};

const getPaletteColor = (palette: string[], t: number) => {
  const clamped = clamp(t, 0, 1);
  const scaled = clamped * (palette.length - 1);
  const idx = Math.floor(scaled);
  const nextIdx = Math.min(palette.length - 1, idx + 1);
  const localT = scaled - idx;
  return lerpColor(palette[idx] ?? FALLBACK_PALETTE[0], palette[nextIdx] ?? FALLBACK_PALETTE[1], localT);
};

const isPaletteResponse = (data: unknown): data is PaletteResponse => {
  if (typeof data !== "object" || data === null) return false;
  if (!("colors" in data)) return false;
  const colors = (data as { colors?: unknown }).colors;
  if (!Array.isArray(colors)) return false;
  return colors.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    if (!("hex" in entry)) return false;
    const hex = (entry as { hex?: unknown }).hex;
    if (typeof hex !== "object" || hex === null) return false;
    const value = (hex as { value?: unknown }).value;
    return typeof value === "string" && /^#?[0-9a-fA-F]{6}$/.test(value);
  });
};

const normalizeHex = (value: string) => (value.startsWith("#") ? value : `#${value}`);

const getDailyPaletteUrl = () => {
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const seed = hashStringToSeed(dateKey);
  const hexSeed = seed.toString(16).padStart(6, "0").slice(0, 6).toUpperCase();
  return `https://www.thecolorapi.com/scheme?hex=${hexSeed}&mode=analogic&count=5`;
};

const createNoiseSampler = (seed: number, gridSize: number) => {
  const rng = mulberry32(seed);
  const grid: number[][] = Array.from({ length: gridSize + 1 }, () =>
    Array.from({ length: gridSize + 1 }, () => rng())
  );

  const sample = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = x - xi;
    const ty = y - yi;
    const x0 = clamp(xi, 0, gridSize);
    const x1 = clamp(xi + 1, 0, gridSize);
    const y0 = clamp(yi, 0, gridSize);
    const y1 = clamp(yi + 1, 0, gridSize);

    const v00 = grid[y0]?.[x0] ?? 0;
    const v10 = grid[y0]?.[x1] ?? 0;
    const v01 = grid[y1]?.[x0] ?? 0;
    const v11 = grid[y1]?.[x1] ?? 0;

    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);

    const ix0 = mix(v00, v10, sx);
    const ix1 = mix(v01, v11, sx);
    return mix(ix0, ix1, sy);
  };

  return (x: number, y: number) => {
    let value = 0;
    let amplitude = 0.6;
    let frequency = 0.08;
    for (let i = 0; i < 3; i += 1) {
      value += sample(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return clamp(value, 0, 1);
  };
};

const getNextPosition = (pos: Vec, dir: Direction): Vec => ({
  x: pos.x + DIRECTIONS[dir].x,
  y: pos.y + DIRECTIONS[dir].y,
});

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

const isInsideGrid = (pos: Vec, gridWidth: number, gridHeight: number) =>
  pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight;

const pickAIDirection = (
  player: PlayerState,
  occupied: Set<string>,
  otherNext: Vec | null,
  gridWidth: number,
  gridHeight: number,
  difficulty: number
): Direction => {
  const maxNodes = 40 + difficulty * 40;

  const countReachable = (start: Vec, blocked: Set<string>) => {
    const queue: Vec[] = [start];
    const visited = new Set<string>([toKey(start)]);
    while (queue.length > 0 && visited.size < maxNodes) {
      const current = queue.shift();
      if (!current) break;
      (["up", "down", "left", "right"] as Direction[]).forEach((dir) => {
        const next = getNextPosition(current, dir);
        const key = toKey(next);
        if (visited.has(key)) return;
        if (!isInsideGrid(next, gridWidth, gridHeight)) return;
        if (blocked.has(key)) return;
        visited.add(key);
        queue.push(next);
      });
    }
    return visited.size;
  };

  const candidates: Direction[] = [player.direction, "left", "right", "up", "down"].filter(
    (dir) => dir !== OPPOSITE[player.direction]
  ) as Direction[];

  const scored = candidates.map((dir) => {
    const next = getNextPosition(player.position, dir);
    const key = toKey(next);
    const safe =
      isInsideGrid(next, gridWidth, gridHeight) && !occupied.has(key) && (!otherNext || key !== toKey(otherNext));
    if (!safe) return { dir, safe, score: -1 };
    const blocked = new Set<string>(occupied);
    if (otherNext) blocked.add(toKey(otherNext));
    const spaceScore = countReachable(next, blocked);
    const straightBonus = dir === player.direction ? 3 : 0;
    const noise = difficulty <= 2 ? Math.random() * (3 - difficulty) : 0;
    return { dir, safe, score: spaceScore + straightBonus + noise };
  });

  const safeMoves = scored.filter((entry) => entry.safe);
  if (safeMoves.length === 0) return player.direction;
  safeMoves.sort((a, b) => b.score - a.score);
  return safeMoves[0].dir;
};

const useCanvasSize = (containerRef: RefObject<HTMLDivElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainRef = useRef<HTMLCanvasElement | null>(null);

  const [palette, setPalette] = useState<string[]>(FALLBACK_PALETTE);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [roundResult, setRoundResult] = useState<RoundResult>({ winner: null, reason: "" });
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [bestOf, setBestOf] = useState(5);
  const [p2Enabled, setP2Enabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [contoursEnabled] = useState(false);

  const size = useCanvasSize(containerRef);

  const accent = useMemo(() => palette[2] ?? FALLBACK_PALETTE[2], [palette]);

  const gameRef = useRef({
    cellSizeX: 10,
    cellSizeY: 10,
    offsetX: 0,
    offsetY: 0,
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    p1ExtraProgress: 0,
    aiExtraProgress: 0,
    particles: [] as Particle[],
    players: {} as Record<PlayerId, PlayerState>,
    occupied: new Set<string>(),
  });

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const paletteRef = useRef(palette);
  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  const fetchPalette = async (url: string) => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Palette fetch failed");
      const data: unknown = await response.json();
      if (!isPaletteResponse(data)) throw new Error("Invalid palette response");
      const colors = data.colors.map((entry) => normalizeHex(entry.hex.value));
      if (colors.length >= 3) {
        setPalette(colors.slice(0, 5));
      } else {
        setPalette(FALLBACK_PALETTE);
      }
    } catch (error) {
      setPalette(FALLBACK_PALETTE);
    }
  };

  useEffect(() => {
    void fetchPalette(getDailyPaletteUrl());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (size.width === 0 || size.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = size.width;
    const height = size.height;
    const cellSizeX = width / GRID_WIDTH;
    const cellSizeY = height / GRID_HEIGHT;
    const gridWidth = GRID_WIDTH;
    const gridHeight = GRID_HEIGHT;
    const offsetX = 0;
    const offsetY = 0;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    if (!terrainRef.current) {
      terrainRef.current = document.createElement("canvas");
    }
    terrainRef.current.width = canvas.width;
    terrainRef.current.height = canvas.height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    gameRef.current.cellSizeX = cellSizeX;
    gameRef.current.cellSizeY = cellSizeY;
    gameRef.current.offsetX = offsetX;
    gameRef.current.offsetY = offsetY;
    gameRef.current.gridWidth = gridWidth;
    gameRef.current.gridHeight = gridHeight;
  }, [size]);

  useEffect(() => {
    const canvas = terrainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const seed = hashStringToSeed(palette.join(""));
    const canvasSize = Math.max(canvas.width, canvas.height) / dpr;
    const noiseGrid = Math.max(64, Math.floor(canvasSize / 10));
    const sampler = createNoiseSampler(seed, noiseGrid);
    const dotSpacing = Math.max(
      6,
      Math.floor(Math.min(gameRef.current.cellSizeX, gameRef.current.cellSizeY) * 0.7)
    );

    for (let y = 0; y < canvas.height / dpr; y += dotSpacing) {
      for (let x = 0; x < canvas.width / dpr; x += dotSpacing) {
        const elevation = sampler(x * 0.5, y * 0.5);
        const radius = (0.38 + elevation * 0.88) * 1.05;
        const color = getPaletteColor(palette, elevation);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.75;
        ctx.arc(x * dpr, y * dpr, radius * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (contoursEnabled) {
          // Contours disabled by default; keep hook for future toggle.
        }
      }
    }
  }, [palette, contoursEnabled, size]);

  const resetRound = () => {
    const { gridWidth, gridHeight } = gameRef.current;
    const p1: PlayerState = {
      id: "p1",
      position: { x: Math.floor(gridWidth * 0.2), y: Math.floor(gridHeight / 2) },
      direction: "right",
      nextDirection: "right",
      trail: [],
      alive: true,
      color: palette[0] ?? FALLBACK_PALETTE[0],
    };

    const p2: PlayerState = {
      id: "p2",
      position: { x: Math.floor(gridWidth * 0.8), y: Math.floor(gridHeight / 2) },
      direction: "left",
      nextDirection: "left",
      trail: [],
      alive: true,
      color: palette[3] ?? FALLBACK_PALETTE[3],
    };

    const occupied = new Set<string>();
    occupied.add(toKey(p1.position));
    occupied.add(toKey(p2.position));

    gameRef.current.players = { p1, p2 };
    gameRef.current.occupied = occupied;
    gameRef.current.p1ExtraProgress = 0;
    gameRef.current.aiExtraProgress = 0;
    gameRef.current.particles = [];
    setRoundResult({ winner: null, reason: "" });
  };

  useEffect(() => {
    const players = gameRef.current.players;
    if (players.p1 && players.p2) {
      players.p1.color = palette[0] ?? FALLBACK_PALETTE[0];
      players.p2.color = palette[3] ?? FALLBACK_PALETTE[3];
    }
    resetRound();
  }, [palette, p2Enabled]);

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    resetRound();
    setPhase("idle");
  }, [size.width, size.height]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (phaseRef.current !== "running" && phaseRef.current !== "round_over") {
        handleStart();
      }
      const key = event.key.toLowerCase();
      const players = gameRef.current.players;
      const p1 = players.p1;
      const p2 = players.p2;
      if (key === "w") p1.nextDirection = p1.direction === "down" ? p1.direction : "up";
      if (key === "s") p1.nextDirection = p1.direction === "up" ? p1.direction : "down";
      if (key === "a") p1.nextDirection = p1.direction === "right" ? p1.direction : "left";
      if (key === "d") p1.nextDirection = p1.direction === "left" ? p1.direction : "right";

      if (!p2Enabled) return;

      if (event.key === "ArrowUp") p2.nextDirection = p2.direction === "down" ? p2.direction : "up";
      if (event.key === "ArrowDown") p2.nextDirection = p2.direction === "up" ? p2.direction : "down";
      if (event.key === "ArrowLeft") p2.nextDirection = p2.direction === "right" ? p2.direction : "left";
      if (event.key === "ArrowRight") p2.nextDirection = p2.direction === "left" ? p2.direction : "right";
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [p2Enabled]);

  useEffect(() => {
    let last = performance.now();
    let accumulator = 0;
    let animationFrame = 0;

    const step = (delta: number) => {
      const game = gameRef.current;
      const { players, occupied, gridWidth, gridHeight } = game;
      const p1 = players.p1;
      const p2 = players.p2;
      const currentPalette = paletteRef.current;
      p1.color = currentPalette[0] ?? FALLBACK_PALETTE[0];
      p2.color = currentPalette[3] ?? FALLBACK_PALETTE[3];

      if (!p1.alive && !p2.alive) return;

      p1.direction = p1.nextDirection;
      if (p2Enabled) {
        p2.direction = p2.nextDirection;
        game.aiExtraProgress = 0;
      } else {
        const nextP1 = getNextPosition(p1.position, p1.direction);
        p2.direction = pickAIDirection(p2, occupied, nextP1, gridWidth, gridHeight, aiDifficulty);
      }

      const nextP1 = getNextPosition(p1.position, p1.direction);
      const nextP2 = getNextPosition(p2.position, p2.direction);

      const p1Key = toKey(nextP1);
      const p2Key = toKey(nextP2);

      const p1Crash =
        !isInsideGrid(nextP1, gridWidth, gridHeight) ||
        occupied.has(p1Key) ||
        (p2Key === p1Key && p2.alive);
      const p2Crash =
        !isInsideGrid(nextP2, gridWidth, gridHeight) ||
        occupied.has(p2Key) ||
        (p1Key === p2Key && p1.alive);

      if (p1Crash) p1.alive = false;
      if (p2Crash) p2.alive = false;

      if (!p1Crash) {
        p1.trail.push({ ...p1.position });
        p1.position = nextP1;
        occupied.add(p1Key);
      }

      if (!p2Crash) {
        p2.trail.push({ ...p2.position });
        p2.position = nextP2;
        occupied.add(p2Key);
      }

      if (p1Crash || p2Crash) {
        const winner = p1Crash && p2Crash ? "draw" : p1Crash ? "p2" : "p1";
        const reason = p1Crash && p2Crash ? "Simultaneous crash" : p1Crash ? "P1 crashed" : "P2 crashed";
        setRoundResult({ winner, reason });
        setPhase("round_over");
        phaseRef.current = "round_over";
        if (winner === "p1") setScores((prev) => ({ ...prev, p1: prev.p1 + 1 }));
        if (winner === "p2") setScores((prev) => ({ ...prev, p2: prev.p2 + 1 }));
        return;
      }

      const playerSpeedMultiplier = 1 + 0.07 * (aiDifficulty - 1);
      game.p1ExtraProgress += playerSpeedMultiplier - 1;
      while (game.p1ExtraProgress >= 1 && p1.alive) {
        game.p1ExtraProgress -= 1;
        const extraNext = getNextPosition(p1.position, p1.direction);
        const extraKey = toKey(extraNext);
        const extraCrash =
          !isInsideGrid(extraNext, gridWidth, gridHeight) ||
          occupied.has(extraKey) ||
          extraKey === toKey(p2.position);
        if (extraCrash) {
          p1.alive = false;
          setRoundResult({ winner: "p2", reason: "P1 crashed" });
          setPhase("round_over");
          phaseRef.current = "round_over";
          setScores((prev) => ({ ...prev, p2: prev.p2 + 1 }));
          return;
        }
        p1.trail.push({ ...p1.position });
        p1.position = extraNext;
        occupied.add(extraKey);
      }

      if (!p2Enabled && p2.alive) {
        const speedMultiplier = 1 + 0.14 * (aiDifficulty - 1);
        game.aiExtraProgress += speedMultiplier - 1;
        while (game.aiExtraProgress >= 1) {
          game.aiExtraProgress -= 1;
          const nextP1 = getNextPosition(p1.position, p1.direction);
          p2.direction = pickAIDirection(p2, occupied, nextP1, gridWidth, gridHeight, aiDifficulty);
          const extraNext = getNextPosition(p2.position, p2.direction);
          const extraKey = toKey(extraNext);
          const extraCrash =
            !isInsideGrid(extraNext, gridWidth, gridHeight) ||
            occupied.has(extraKey) ||
            extraKey === toKey(p1.position);
          if (extraCrash) {
            p2.alive = false;
            setRoundResult({ winner: "p1", reason: "P2 crashed" });
            setPhase("round_over");
            phaseRef.current = "round_over";
            setScores((prev) => ({ ...prev, p1: prev.p1 + 1 }));
            return;
          }
          p2.trail.push({ ...p2.position });
          p2.position = extraNext;
          occupied.add(extraKey);
        }
      }

      const spawnParticles = (player: PlayerState) => {
        const cx = (player.position.x + 0.5) * game.cellSizeX;
        const cy = (player.position.y + 0.5) * game.cellSizeY;
        for (let i = 0; i < 4; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.2 + Math.random() * 0.6;
          game.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.4,
            color: player.color,
          });
        }
      };

      spawnParticles(p1);
      spawnParticles(p2);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      const terrain = terrainRef.current;
      if (!canvas || !terrain) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { particles } = gameRef.current;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(terrain, 0, 0);

      const { cellSizeX, cellSizeY, players, gridWidth, gridHeight } = gameRef.current;
      const dpr = window.devicePixelRatio || 1;
      const fieldWidth = cellSizeX * gridWidth;
      const fieldHeight = cellSizeY * gridHeight;


      const drawTrail = (player: PlayerState) => {
        const trailCount = player.trail.length;
        for (let i = 0; i < trailCount; i += 1) {
          const segment = player.trail[i];
          const ageT = i / Math.max(1, trailCount - 1);
          const alpha = 0.2 + ageT * 0.7;
          const glow = 6 + ageT * 10;
          ctx.shadowColor = player.color;
          ctx.shadowBlur = glow * dpr;
          ctx.fillStyle = player.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(
            segment.x * cellSizeX * dpr,
            segment.y * cellSizeY * dpr,
            cellSizeX * dpr,
            cellSizeY * dpr
          );
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      };

      drawTrail(players.p1);
      drawTrail(players.p2);

      const drawParticles = () => {
        particles.forEach((p) => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(p.x * dpr, p.y * dpr, 1.4 * dpr, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      };

      const drawHead = (player: PlayerState) => {
        const baseX = player.position.x * cellSizeX;
        const baseY = player.position.y * cellSizeY;
        const w = cellSizeX;
        const h = cellSizeY;
        const centerX = baseX + w / 2;
        const centerY = baseY + h / 2;
        const dirVec = DIRECTIONS[player.direction];
        const shift = Math.min(w, h) * 0.28;
        const shiftX = dirVec.x * shift;
        const shiftY = dirVec.y * shift;
        const headLength = Math.min(w, h) * 0.9;
        const tailWidth = Math.min(w, h) * 0.5;
        const tailLength = Math.min(w, h) * 0.6;

        let tipX = centerX;
        let tipY = centerY;
        let leftX = centerX;
        let leftY = centerY;
        let rightX = centerX;
        let rightY = centerY;

        switch (player.direction) {
          case "up":
            tipY = baseY + h * 0.05;
            leftX = centerX - tailWidth / 2;
            leftY = baseY + h * 0.75;
            rightX = centerX + tailWidth / 2;
            rightY = baseY + h * 0.75;
            break;
          case "down":
            tipY = baseY + h * 0.95;
            leftX = centerX - tailWidth / 2;
            leftY = baseY + h * 0.25;
            rightX = centerX + tailWidth / 2;
            rightY = baseY + h * 0.25;
            break;
          case "left":
            tipX = baseX + w * 0.05;
            leftX = baseX + w * 0.75;
            leftY = centerY - tailWidth / 2;
            rightX = baseX + w * 0.75;
            rightY = centerY + tailWidth / 2;
            break;
          case "right":
            tipX = baseX + w * 0.95;
            leftX = baseX + w * 0.25;
            leftY = centerY - tailWidth / 2;
            rightX = baseX + w * 0.25;
            rightY = centerY + tailWidth / 2;
            break;
        }

        ctx.shadowColor = player.color;
        ctx.shadowBlur = 18 * dpr;
        ctx.fillStyle = player.color;
        ctx.strokeStyle = "#0b0d14";
        ctx.lineWidth = 2 * dpr;

        const tailOffsetX = -dirVec.x * tailLength;
        const tailOffsetY = -dirVec.y * tailLength;
        ctx.shadowBlur = 26 * dpr;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(
          (centerX + shiftX + tailOffsetX - tailWidth / 2) * dpr,
          (centerY + shiftY + tailOffsetY - tailWidth / 6) * dpr,
          tailWidth * dpr,
          (tailWidth / 3) * dpr
        );
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo((tipX + shiftX) * dpr, (tipY + shiftY) * dpr);
        ctx.lineTo((leftX + shiftX) * dpr, (leftY + shiftY) * dpr);
        ctx.lineTo((rightX + shiftX) * dpr, (rightY + shiftY) * dpr);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.35;
        ctx.fillRect(
          (centerX + shiftX - headLength / 2) * dpr,
          (centerY + shiftY - 1.2) * dpr,
          headLength * dpr,
          2.4 * dpr
        );
        ctx.globalAlpha = 1;
      };

      drawHead(players.p1);
      drawHead(players.p2);
      drawParticles();
    };

    const loop = (now: number) => {
      const currentPhase = phaseRef.current;
      if (currentPhase === "running") {
        const delta = now - last;
        last = now;
        accumulator += delta;
        while (accumulator >= STEP_MS) {
          step(STEP_MS);
          accumulator -= STEP_MS;
        }
      } else {
        last = now;
        accumulator = 0;
      }
      draw();
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [p2Enabled]);

  const handleStart = () => {
    if (matchWinner) return;
    if (phase === "idle" || phase === "round_over") {
      resetRound();
      setPhase("running");
    }
  };

  const handlePause = () => {
    setPhase((prev) => (prev === "running" ? "paused" : prev === "paused" ? "running" : prev));
  };

  const handleRestartMatch = () => {
    setScores({ p1: 0, p2: 0 });
    setPhase("idle");
    resetRound();
  };

  const getRandomPaletteUrl = () => {
    const seed = Math.floor(Math.random() * 0xffffff);
    const hexSeed = seed.toString(16).padStart(6, "0").toUpperCase();
    const cacheBust = Date.now().toString(16);
    return `https://www.thecolorapi.com/scheme?hex=${hexSeed}&mode=analogic&count=5&bust=${cacheBust}`;
  };

  const handleRandomizePalette = () => {
    void fetchPalette(getRandomPaletteUrl());
  };

  const requiredWins = Math.ceil(bestOf / 2);
  const matchWinner = scores.p1 >= requiredWins ? "p1" : scores.p2 >= requiredWins ? "p2" : null;

  return (
    <div className="app" style={{ ["--accent" as const]: accent }}>
      <header className="header">
        <div>
          <h1>Tron Topo Arena</h1>
          <p>Neon cycles on a dot-topographic field. Best of {bestOf}.</p>
        </div>
        <div className="scoreboard">
          <div className="score">
            <span>P1 {scores.p1}</span>
            <small>WASD</small>
          </div>
          <div className="score">
            <span>P2 {scores.p2}</span>
            <small>Arrows</small>
          </div>
        </div>
      </header>

      <section className="controls">
        <button onClick={handleStart} disabled={phase === "running" || matchWinner !== null}>
          {phase === "round_over" ? "Next Round" : "Start"}
        </button>
        <button onClick={handlePause} disabled={phase === "idle" || phase === "round_over"}>
          {phase === "paused" ? "Resume" : "Pause"}
        </button>
        <button onClick={handleRestartMatch}>Restart Match</button>
        <button onClick={handleRandomizePalette}>Randomize Palette</button>
        <label className="toggle">
          <input type="checkbox" checked={p2Enabled} onChange={(event) => setP2Enabled(event.target.checked)} />
          Player 2 Human
        </label>
        <label className="select">
          Best Of
          <select value={bestOf} onChange={(event) => setBestOf(parseInt(event.target.value, 10))}>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={7}>7</option>
          </select>
        </label>
        {!p2Enabled && (
          <label className="select">
            AI Difficulty
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={aiDifficulty}
              onChange={(event) => setAiDifficulty(parseInt(event.target.value, 10))}
            />
            <span>{aiDifficulty}</span>
          </label>
        )}
      </section>


      <section className="arena" ref={containerRef}>
        <canvas className="game-canvas" ref={canvasRef} aria-label="Tron game canvas" role="img" />
        {phase === "round_over" && (
          <div className="overlay">
            <div className="overlay-card">
              <h2>{roundResult.winner === "draw" ? "Draw" : roundResult.winner === "p1" ? "P1 Wins" : "P2 Wins"}</h2>
              <p>{roundResult.reason}</p>
              {matchWinner && <p className="winner">Match Winner: {matchWinner === "p1" ? "Player 1" : "Player 2"}</p>}
              <button onClick={matchWinner ? handleRestartMatch : handleStart}>
                {matchWinner ? "Play Again" : "Next Round"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
