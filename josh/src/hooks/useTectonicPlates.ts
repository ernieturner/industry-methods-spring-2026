import { useEffect, useState } from "react";

interface PlateGeometry {
  type: string;
  coordinates: number[][] | number[][][];
}

interface PlateFeature {
  type: "Feature";
  geometry: PlateGeometry;
  properties: Record<string, unknown>;
}

export interface PlateCollection {
  type: "FeatureCollection";
  features: PlateFeature[];
}

const PLATES_URL =
  "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

let cachedData: PlateCollection | null = null;

export function useTectonicPlates(enabled: boolean): {
  data: PlateCollection | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<PlateCollection | null>(cachedData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || cachedData !== null) {
      if (cachedData !== null) setData(cachedData);
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(PLATES_URL);
        if (!response.ok) {
          if (!cancelled) {
            setError(`Failed to fetch plate data: ${response.status}`);
          }
          return;
        }
        const json = (await response.json()) as PlateCollection;
        cachedData = json;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load tectonic plates";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading, error };
}
