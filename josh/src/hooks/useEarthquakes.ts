import { useCallback, useEffect, useState } from "react";
import {
  fetchEarthquakes,
  type EarthquakeTimePeriod,
} from "../api/earthquakes";
import type { EarthquakeFeature } from "../types/earthquake";

interface UseEarthquakesResult {
  earthquakes: EarthquakeFeature[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  title: string;
  refetch: () => void;
}

export function useEarthquakes(
  period: EarthquakeTimePeriod,
): UseEarthquakesResult {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEarthquakes(period);
      setEarthquakes(data.features);
      setTotalCount(data.metadata.count);
      setTitle(data.metadata.title);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return { earthquakes, loading, error, totalCount, title, refetch: load };
}
