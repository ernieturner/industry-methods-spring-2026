import { useEffect, useRef } from "react";
import type { EarthquakeTimePeriod } from "../api/earthquakes";
import { readUrlState, writeUrlState } from "../utils/url";

interface UrlStateValues {
  selectedId: string | null;
  period: EarthquakeTimePeriod;
  minMag: number;
  maxMag: number;
}

export function useUrlStateInit(): {
  initialPeriod: EarthquakeTimePeriod;
  initialEarthquakeId: string | null;
  initialMinMag: number;
  initialMaxMag: number;
} {
  const urlState = readUrlState();
  return {
    initialPeriod: urlState.period ?? "day",
    initialEarthquakeId: urlState.earthquake ?? null,
    initialMinMag: urlState.minMag ?? 0,
    initialMaxMag: urlState.maxMag ?? 10,
  };
}

export function useUrlStateSync(values: UrlStateValues): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    writeUrlState({
      earthquake: values.selectedId ?? undefined,
      period: values.period,
      minMag: values.minMag,
      maxMag: values.maxMag,
    });
  }, [values.selectedId, values.period, values.minMag, values.maxMag]);
}
