import { z } from "zod";

const Country = z.object({
  name: z.object({ common: z.string() }),
  region: z.string().optional(),
  subregion: z.string().optional(),
  currencies: z.record(z.object({ name: z.string().optional(), symbol: z.string().optional() })).optional(),
});

const CountriesResponse = z.array(Country);
export type CountryInfo = z.infer<typeof Country>;

export async function fetchCountryByCode(
  countryCode2: string,
  signal?: AbortSignal
): Promise<CountryInfo | null> {
  const cc = countryCode2.trim().toLowerCase();
  if (cc.length !== 2) return null;

  const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(cc)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const json = await res.json();
  const parsed = CountriesResponse.safeParse(json);
  if (!parsed.success) return null;

  return parsed.data[0] ?? null;
}

