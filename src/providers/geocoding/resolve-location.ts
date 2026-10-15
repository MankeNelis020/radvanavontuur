import { findCity } from "@/data/cities";
import type { GeocodeResult } from "@/providers/types";
import { fetchWithTimeout } from "@/providers/http";

export async function resolveLocation(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", trimmed);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "nl");
    url.searchParams.set("countryCode", "NL");
    const response = await fetchWithTimeout(url.toString(), {}, 3500);
    if (response.ok) {
      const body = (await response.json()) as {
        results?: { name?: string; admin1?: string; latitude?: number; longitude?: number }[];
      };
      const hit = body.results?.[0];
      if (hit?.name && hit.latitude !== undefined && hit.longitude !== undefined) {
        return {
          lat: hit.latitude,
          lng: hit.longitude,
          label: hit.admin1 ? `${hit.name}, ${hit.admin1}` : hit.name,
          source: "geocoding",
        };
      }
    }
  } catch {
    // Val terug op de interne plaatsenlijst.
  }
  const city = findCity(trimmed);
  if (!city) return null;
  return {
    lat: city.lat,
    lng: city.lng,
    label: `${city.name} (plaatscentrum uit de interne lijst)`,
    source: "gazetteer",
  };
}
