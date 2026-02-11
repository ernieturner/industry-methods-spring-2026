import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Place } from "../lib/types/domain";
import { searchPlaces } from "../lib/api/nominatim";
import { loadFavorites } from "../lib/storage/favorites";
import { Badge, Button, Card, CardDesc, CardTitle, Input } from "../components/ui";

function toPlaceUrl(p: Place): string {
  const sp = new URLSearchParams();
  sp.set("name", p.name);
  sp.set("displayName", p.displayName);
  sp.set("lat", String(p.lat));
  sp.set("lon", String(p.lon));
  if (p.country) sp.set("country", p.country);
  if (p.countryCode) sp.set("cc", p.countryCode);
  return `/place?${sp.toString()}`;
}

export default function HomePage() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Place[]>(() => loadFavorites());
  const [mode, setMode] = useState<"All" | "Cities" | "Regions">("All");

  const abortRef = useRef<AbortController | null>(null);
  const canSearch = q.trim().length >= 2;

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    setErr(null);
    if (!canSearch) {
      setResults([]);
      abortRef.current?.abort();
      return;
    }

    const handle = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      try {
        const r = await searchPlaces(q, ac.signal);
        setResults(r);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErr(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [q, canSearch]);

  const showDropdown = useMemo(
    () => canSearch && (loading || results.length > 0 || !!err),
    [canSearch, loading, results.length, err]
  );

  return (
    <div className="flex flex-col gap-32">
      {/* Hero */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight leading-tight text-[var(--app-text)]">
            Explain This Place
          </h1>
          <p className="max-w-2xl text-[var(--muted)] text-lg leading-relaxed">
            Search a destination and get a quick, travel-friendly summary — what it’s like, when to
            go, how busy it gets, and what to expect.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center"
          style={{ columnGap: "24px", rowGap: "12px" }}
        >
          <Badge>🧭 Client-only</Badge>
          <Badge>🛰️ Free public APIs</Badge>
          <Badge>🧪 Estimates labeled</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="section-gap" />
      <Card className="max-w-2xl p-8 shadow-none card-bottom-gap">
        <div className="space-y-6 pb-4 section-content">
          <div>
            <CardTitle>Search a place</CardTitle>
            <CardDesc>Type at least 2 characters to see suggestions.</CardDesc>
          </div>

          <div className="rounded-full border border-[color:var(--card-border)] bg-[var(--chip-bg)] p-1 w-fit">
            {(["All", "Cities", "Regions"] as const).map((label) => (
              <button
                key={label}
                onClick={() => setMode(label)}
                className={[
                  "px-4 py-2 text-sm font-semibold rounded-full transition whitespace-nowrap",
                  mode === label
                    ? "bg-white text-black dark:bg-white dark:text-black shadow"
                    : "text-[var(--muted)] hover:text-[var(--app-text)]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* INPUT LANE: prevents the input border from touching the card border */}
          <div className="relative mt-6 mb-16 tab-to-input-gap">
            <div className="rounded-3xl bg-[var(--app-bg)]/40 p-4">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a city, town, or region…"
                aria-label="Search a place"
                className="h-12 px-6"
              />
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-3 overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] shadow-xl z-50">
                {loading && <div className="px-6 py-4 text-[var(--muted)]">Searching…</div>}
                {err && <div className="px-6 py-4 text-red-600">{err}</div>}
                {!loading && !err && results.length === 0 && (
                  <div className="px-6 py-4 text-[var(--muted)]">
                    No matches. Try a different spelling.
                  </div>
                )}

                {!err &&
                  results.map((p) => (
                    <div
                      key={`${p.lat}-${p.lon}-${p.displayName}`}
                      className="border-t border-[color:var(--card-border)] first:border-t-0"
                    >
                      <button
                        onClick={() => navigate(toPlaceUrl(p))}
                        className="w-full text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <div className="font-semibold text-[var(--app-text)]">{p.name}</div>
                        <div className="text-sm text-[var(--muted)] truncate">{p.displayName}</div>
                        {p.country ? (
                          <div className="mt-2">
                            <Badge>{p.country}</Badge>
                          </div>
                        ) : null}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="h-16" />
        </div>
      </Card>

      {/* Favorites */}
      <div className="section-gap" />

      <Card className="p-10 shadow-none dark:border-[#1e222a]">
        <div className="space-y-6 section-content">
          {/* padding-bottom guarantees space under Refresh */}
          <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
                Favorites
              </h2>
              <p className="text-[var(--muted)] text-sm">
                Saved places show up here for quick access.
              </p>
            </div>

            <Button variant="secondary" onClick={() => setFavorites(loadFavorites())}>
              Refresh
            </Button>
          </div>

          {favorites.length === 0 ? (
            <div className="text-[var(--muted)] leading-relaxed card-bottom-gap">
              No favorites yet. Search a place and hit <span className="font-medium">Save</span>.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((p) => (
                <button
                  key={`${p.lat}-${p.lon}-${p.displayName}`}
                  onClick={() => navigate(toPlaceUrl(p))}
                  className="text-left focus:outline-none focus-visible:outline-none"
                >
                  <div className="rounded-3xl border border-transparent bg-[var(--chip-bg)] p-6 hover:bg-black/5 dark:hover:bg-white/5 transition dark:border-[#14171c] overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--app-text)]">{p.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)] truncate">
                          {p.displayName}
                        </div>
                      </div>
                      {p.country ? <Badge>{p.country}</Badge> : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="section-gap" />
    </div>
  );
}
