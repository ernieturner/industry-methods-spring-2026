import type { EarthquakeFeature } from "../types/earthquake";

export interface EarthquakeCluster {
  id: string;
  lat: number;
  lng: number;
  earthquakes: EarthquakeFeature[];
  maxMagnitude: number;
  avgMagnitude: number;
}

interface PixelPoint {
  x: number;
  y: number;
  earthquake: EarthquakeFeature;
}

function latLngToPixel(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    scale;
  return { x, y };
}

export function clusterEarthquakes(
  earthquakes: EarthquakeFeature[],
  zoom: number,
  clusterPixelRadius: number = 60,
): EarthquakeCluster[] {
  const points: PixelPoint[] = earthquakes.map((eq) => {
    const [lng, lat] = eq.geometry.coordinates;
    const pixel = latLngToPixel(lat ?? 0, lng ?? 0, zoom);
    return { x: pixel.x, y: pixel.y, earthquake: eq };
  });

  const used = new Set<number>();
  const clusters: EarthquakeCluster[] = [];

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;

    const point = points[i];
    if (!point) continue;

    const group: EarthquakeFeature[] = [point.earthquake];
    used.add(i);

    let sumLat = point.earthquake.geometry.coordinates[1] ?? 0;
    let sumLng = point.earthquake.geometry.coordinates[0] ?? 0;

    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      const other = points[j];
      if (!other) continue;

      const dx = point.x - other.x;
      const dy = point.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= clusterPixelRadius) {
        group.push(other.earthquake);
        used.add(j);
        sumLat += other.earthquake.geometry.coordinates[1] ?? 0;
        sumLng += other.earthquake.geometry.coordinates[0] ?? 0;
      }
    }

    let maxMag = 0;
    let sumMag = 0;
    let magCount = 0;
    for (const eq of group) {
      const mag = eq.properties.mag ?? 0;
      if (mag > maxMag) maxMag = mag;
      sumMag += mag;
      magCount++;
    }

    clusters.push({
      id: `cluster-${i}`,
      lat: sumLat / group.length,
      lng: sumLng / group.length,
      earthquakes: group,
      maxMagnitude: maxMag,
      avgMagnitude: magCount > 0 ? sumMag / magCount : 0,
    });
  }

  return clusters;
}
