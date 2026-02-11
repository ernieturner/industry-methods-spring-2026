import { useEffect, useState } from "react";
import { fetchWeather } from "../api/weather";
import type { OpenMeteoResponse } from "../types/weather";

interface UseWeatherResult {
  weather: OpenMeteoResponse | null;
  loading: boolean;
  error: string | null;
}

export function useWeather(
  latitude: number | null,
  longitude: number | null,
): UseWeatherResult {
  const [weather, setWeather] = useState<OpenMeteoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setWeather(null);
      return;
    }

    let cancelled = false;

    async function load(lat: number, lng: number): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchWeather(lat, lng);
        if (!cancelled) {
          setWeather(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unknown error occurred";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load(latitude, longitude);

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return { weather, loading, error };
}
