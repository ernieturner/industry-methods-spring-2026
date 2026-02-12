import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { EarthquakeFeature } from "../types/earthquake";
import { getMagnitudeColor } from "../utils/magnitude";

interface HeatmapLayerProps {
  earthquakes: EarthquakeFeature[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return { r: 255, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  map: L.Map,
  earthquakes: EarthquakeFeature[],
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  for (const eq of earthquakes) {
    const [lng, lat] = eq.geometry.coordinates;
    const point = map.latLngToContainerPoint([lat ?? 0, lng ?? 0]);
    const mag = eq.properties.mag ?? 0;

    const radius = Math.max(20, mag * 15);
    const color = hexToRgb(getMagnitudeColor(mag));

    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius,
    );

    const alpha = Math.min(0.6, 0.15 + mag * 0.06);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
    gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function HeatmapLayer({ earthquakes }: HeatmapLayerProps): null {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "400";
    map.getContainer().appendChild(canvas);
    canvasRef.current = canvas;

    drawHeatmap(canvas, map, earthquakes);

    return () => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [map, earthquakes]);

  useMapEvents({
    moveend: () => {
      if (canvasRef.current) {
        drawHeatmap(canvasRef.current, map, earthquakes);
      }
    },
    zoomend: () => {
      if (canvasRef.current) {
        drawHeatmap(canvasRef.current, map, earthquakes);
      }
    },
    resize: () => {
      if (canvasRef.current) {
        drawHeatmap(canvasRef.current, map, earthquakes);
      }
    },
  });

  return null;
}

export default HeatmapLayer;
