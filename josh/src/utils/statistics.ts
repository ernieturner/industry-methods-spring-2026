import type { EarthquakeFeature } from "../types/earthquake";

export interface EarthquakeStats {
  count: number;
  maxMagnitude: number;
  minMagnitude: number;
  avgMagnitude: number;
  maxMagQuake: EarthquakeFeature | null;
  mostRecent: EarthquakeFeature | null;
  tsunamiCount: number;
}

export function computeStatistics(
  earthquakes: EarthquakeFeature[],
): EarthquakeStats {
  if (earthquakes.length === 0) {
    return {
      count: 0,
      maxMagnitude: 0,
      minMagnitude: 0,
      avgMagnitude: 0,
      maxMagQuake: null,
      mostRecent: null,
      tsunamiCount: 0,
    };
  }

  let maxMag = -Infinity;
  let minMag = Infinity;
  let sumMag = 0;
  let magCount = 0;
  let maxMagQuake: EarthquakeFeature | null = null;
  let mostRecent: EarthquakeFeature | null = null;
  let tsunamiCount = 0;

  for (const eq of earthquakes) {
    const mag = eq.properties.mag;
    if (mag !== null) {
      sumMag += mag;
      magCount++;
      if (mag > maxMag) {
        maxMag = mag;
        maxMagQuake = eq;
      }
      if (mag < minMag) {
        minMag = mag;
      }
    }
    if (mostRecent === null || eq.properties.time > mostRecent.properties.time) {
      mostRecent = eq;
    }
    if (eq.properties.tsunami === 1) {
      tsunamiCount++;
    }
  }

  return {
    count: earthquakes.length,
    maxMagnitude: maxMag === -Infinity ? 0 : maxMag,
    minMagnitude: minMag === Infinity ? 0 : minMag,
    avgMagnitude: magCount > 0 ? sumMag / magCount : 0,
    maxMagQuake,
    mostRecent,
    tsunamiCount,
  };
}
