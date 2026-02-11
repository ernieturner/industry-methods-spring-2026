import { z } from "zod";
import type { Place } from "../types/domain";

const NominatimItem = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  type: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      municipality: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    })
    .optional(),
});

const NominatimResponse = z.array(NominatimItem);

function pickName(addr: z.infer<typeof NominatimItem>["address"]): string | null {
  if (!addr) return null;
  return (
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.county ??
    addr.state ??
    null
  );
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    method: "GET",
    signal,
    headers: {
      // Nominatim asks for a valid UA in production; local use is fine,
      // but adding a simple header is harmless.
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Nominatim error (${res.status})`);

  const json = await res.json();
  const parsed = NominatimResponse.safeParse(json);
  if (!parsed.success) throw new Error("Unexpected Nominatim response");

  return parsed.data.map((item) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    const name = pickName(item.address) ?? item.display_name.split(",")[0]?.trim() ?? item.display_name;

    return {
      displayName: item.display_name,
      name,
      lat,
      lon,
      country: item.address?.country ?? null,
      countryCode: item.address?.country_code?.toLowerCase() ?? null,
    };
  });
}

