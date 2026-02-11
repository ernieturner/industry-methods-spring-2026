import type { DailyForecast } from "../api/openMeteo";
import type { CountryInfo } from "../api/restCountries";

export function bestTimeHeuristic(lat: number): string {
  const a = Math.abs(lat);
  if (a < 23.5) return "Often best during the drier season (varies by region). Shoulder months can be great.";
  if (a < 35) return "Spring and fall are often the sweet spot (warm but not extreme).";
  if (a < 55) return "Late spring through early fall is usually best; shoulder seasons can reduce crowds.";
  return "Summer is typically best; winters can be harsh but great for snow sports if applicable.";
}

export function crowdsHeuristic(wikiExtract: string | undefined): { level: "Low" | "Medium" | "High"; note: string } {
  const text = (wikiExtract ?? "").toLowerCase();
  const hits =
    (text.includes("tourist") ? 1 : 0) +
    (text.includes("popular") ? 1 : 0) +
    (text.includes("visited") ? 1 : 0) +
    (text.includes("capital") ? 1 : 0) +
    (text.includes("unesco") ? 1 : 0);

  if (hits >= 3) return { level: "High", note: "Likely a major destination. Expect peak crowds in summer/holidays." };
  if (hits === 2) return { level: "Medium", note: "Some tourism presence. Shoulder seasons may feel calmer." };
  return { level: "Low", note: "Less obviously tourist-heavy (based on public info). Could feel more local." };
}

export function priceHeuristic(country: CountryInfo | null): { level: "Budget" | "Moderate" | "Expensive"; note: string } {
  const region = (country?.region ?? "").toLowerCase();
  const sub = (country?.subregion ?? "").toLowerCase();

  const expensive =
    region.includes("europe") && (sub.includes("northern") || sub.includes("western"));
  const moderate =
    region.includes("europe") && (sub.includes("southern") || sub.includes("eastern"));

  if (expensive) return { level: "Expensive", note: "Rough estimate: Western/Northern Europe often costs more." };
  if (moderate) return { level: "Moderate", note: "Rough estimate: many Southern/Eastern European spots are mid-range." };

  if (region.includes("oceania") || region.includes("north america"))
    return { level: "Expensive", note: "Rough estimate: many destinations in this region skew pricier." };

  if (region.includes("asia") || region.includes("africa") || region.includes("south america"))
    return { level: "Budget", note: "Rough estimate: many destinations here can be cheaper (varies widely)." };

  return { level: "Moderate", note: "Rough estimate based on region; costs vary by city and season." };
}

export function bestThisWeekFromForecast(forecast: DailyForecast[]): string {
  if (forecast.length === 0) return "No forecast available.";
  const scored = forecast.map((d) => {
    // lower precip + moderate temps + lower wind = better
    const tempMid = (d.tMaxC + d.tMinC) / 2;
    const tempPenalty = Math.abs(tempMid - 20); // 20C sweet spot
    const score = d.precipMm * 2 + tempPenalty + d.windMaxKph * 0.2;
    return { d, score };
  });
  scored.sort((a, b) => a.score - b.score);
  const best = scored[0]?.d;
  if (!best) return "No forecast available.";
  return `Best-looking day this week: ${best.date} (low rain + comfortable temps estimate).`;
}

