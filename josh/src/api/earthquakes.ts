import type { USGSResponse } from "../types/earthquake";

const USGS_BASE_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";

export type EarthquakeTimePeriod = "hour" | "day" | "week" | "month";

const PERIOD_PATHS: Record<EarthquakeTimePeriod, string> = {
  hour: "all_hour.geojson",
  day: "all_day.geojson",
  week: "all_week.geojson",
  month: "all_month.geojson",
};

export async function fetchEarthquakes(
  period: EarthquakeTimePeriod = "day",
): Promise<USGSResponse> {
  const path = PERIOD_PATHS[period];
  const response = await fetch(`${USGS_BASE_URL}/${path}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch earthquake data: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as USGSResponse;
}
