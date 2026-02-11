export interface EarthquakeProperties {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number;
  gap: number | null;
  magType: string | null;
  type: string;
  title: string;
}

export interface EarthquakeGeometry {
  type: string;
  coordinates: [number, number, number]; // [longitude, latitude, depth_km]
}

export interface EarthquakeFeature {
  type: string;
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface USGSMetadata {
  generated: number;
  url: string;
  title: string;
  status: number;
  api: string;
  count: number;
}

export interface USGSResponse {
  type: string;
  metadata: USGSMetadata;
  features: EarthquakeFeature[];
}
