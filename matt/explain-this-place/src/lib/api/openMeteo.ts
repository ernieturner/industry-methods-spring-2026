import { z } from "zod";

const Forecast = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    wind_speed_10m_max: z.array(z.number()),
  }),
});

export type DailyForecast = {
  date: string;
  tMaxC: number;
  tMinC: number;
  precipMm: number;
  windMaxKph: number;
};

export async function fetch7DayForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<DailyForecast[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
  );

  const res = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Open-Meteo error (${res.status})`);

  const json = await res.json();
  const parsed = Forecast.safeParse(json);
  if (!parsed.success) throw new Error("Unexpected Open-Meteo response");

  const d = parsed.data.daily;
  const n = Math.min(d.time.length, 7);

  const out: DailyForecast[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      date: d.time[i],
      tMaxC: d.temperature_2m_max[i],
      tMinC: d.temperature_2m_min[i],
      precipMm: d.precipitation_sum[i],
      windMaxKph: d.wind_speed_10m_max[i],
    });
  }
  return out;
}

