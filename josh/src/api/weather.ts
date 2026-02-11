import type { OpenMeteoResponse } from "../types/weather";

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current_weather: "true",
    timezone: "auto",
  });

  const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch weather data: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as OpenMeteoResponse;
}
