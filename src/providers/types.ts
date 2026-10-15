import type { EngineDestination, WeatherSnapshot } from "@/domain/types";

export type ProviderMode = "live" | "fixture" | "unavailable" | "catalog_only";

export type TravelQuote = {
  durationSeconds: number;
  distanceMeters: number;
  source: "google_routes";
  fetchedAt: string;
};

export type WeatherProvider = {
  mode: "live" | "fixture" | "unavailable";
  label: string;
  getForecast(input: {
    latitude: number;
    longitude: number;
    at: Date;
  }): Promise<WeatherSnapshot>;
};

export type PlacesProvider = {
  mode: "live" | "unavailable";
  label: string;
  enrich(input: {
    origin: { lat: number; lng: number };
    radiusMeters: number;
    catalog: EngineDestination[];
  }): Promise<{ destinations: EngineDestination[]; requests: number; note: string }>;
};

export type RoutesProvider = {
  mode: "live" | "unavailable";
  label: string;
  quote(input: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    mode: "car" | "bicycle" | "walking" | "public_transport";
  }): Promise<TravelQuote | null>;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
  source: "geocoding" | "gazetteer";
};
