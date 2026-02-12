import type { EarthquakeTimePeriod } from "../api/earthquakes";

export interface UrlState {
  earthquake: string | null;
  period: EarthquakeTimePeriod;
  lat: number;
  lng: number;
  zoom: number;
  minMag: number;
  maxMag: number;
}

const VALID_PERIODS: EarthquakeTimePeriod[] = ["hour", "day", "week", "month"];

function isValidPeriod(value: string): value is EarthquakeTimePeriod {
  return (VALID_PERIODS as string[]).includes(value);
}

export function readUrlState(): Partial<UrlState> {
  const params = new URLSearchParams(window.location.search);
  const state: Partial<UrlState> = {};

  const eq = params.get("eq");
  if (eq) state.earthquake = eq;

  const period = params.get("period");
  if (period && isValidPeriod(period)) state.period = period;

  const lat = params.get("lat");
  if (lat) {
    const parsed = parseFloat(lat);
    if (!isNaN(parsed)) state.lat = parsed;
  }

  const lng = params.get("lng");
  if (lng) {
    const parsed = parseFloat(lng);
    if (!isNaN(parsed)) state.lng = parsed;
  }

  const zoom = params.get("zoom");
  if (zoom) {
    const parsed = parseInt(zoom, 10);
    if (!isNaN(parsed)) state.zoom = parsed;
  }

  const minMag = params.get("minMag");
  if (minMag) {
    const parsed = parseFloat(minMag);
    if (!isNaN(parsed)) state.minMag = parsed;
  }

  const maxMag = params.get("maxMag");
  if (maxMag) {
    const parsed = parseFloat(maxMag);
    if (!isNaN(parsed)) state.maxMag = parsed;
  }

  return state;
}

export function writeUrlState(state: Partial<UrlState>): void {
  const params = new URLSearchParams();

  if (state.earthquake) params.set("eq", state.earthquake);
  if (state.period && state.period !== "day") params.set("period", state.period);
  if (state.lat !== undefined) params.set("lat", state.lat.toFixed(4));
  if (state.lng !== undefined) params.set("lng", state.lng.toFixed(4));
  if (state.zoom !== undefined) params.set("zoom", state.zoom.toString());
  if (state.minMag !== undefined && state.minMag > 0)
    params.set("minMag", state.minMag.toFixed(1));
  if (state.maxMag !== undefined && state.maxMag < 10)
    params.set("maxMag", state.maxMag.toFixed(1));

  const search = params.toString();
  const newUrl = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.replaceState(null, "", newUrl);
}
