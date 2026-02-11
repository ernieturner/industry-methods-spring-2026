export type Place = {
  displayName: string;
  name: string; // short label (city/town/region)
  lat: number;
  lon: number;
  country: string | null;
  countryCode: string | null; // e.g. "pt"
};

