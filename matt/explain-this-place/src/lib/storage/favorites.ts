import { z } from "zod";
import type { Place } from "../types/domain";

const FavoriteSchema = z.object({
  displayName: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  country: z.string().nullable(),
  countryCode: z.string().nullable(),
});

const FavoritesSchema = z.array(FavoriteSchema);

const KEY = "explain_this_place_favorites_v1";

export function loadFavorites(): Place[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    const parsed = FavoritesSchema.safeParse(json);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favs: Place[]): void {
  localStorage.setItem(KEY, JSON.stringify(favs));
}

export function toggleFavorite(place: Place): Place[] {
  const favs = loadFavorites();
  const exists = favs.some((p) => p.lat === place.lat && p.lon === place.lon && p.displayName === place.displayName);
  const next = exists
    ? favs.filter((p) => !(p.lat === place.lat && p.lon === place.lon && p.displayName === place.displayName))
    : [place, ...favs].slice(0, 20);
  saveFavorites(next);
  return next;
}

export function isFavorite(place: Place): boolean {
  const favs = loadFavorites();
  return favs.some((p) => p.lat === place.lat && p.lon === place.lon && p.displayName === place.displayName);
}

