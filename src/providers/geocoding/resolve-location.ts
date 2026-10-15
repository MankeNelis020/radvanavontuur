import { CITY_CENTERS, findCity } from "@/data/cities";
import { haversineKm } from "@/domain/geo";
import type { GeocodeResult } from "@/providers/types";
import { fetchWithTimeout } from "@/providers/http";

export type CoarseAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  city_district?: string;
  suburb?: string;
  state?: string;
};

/** Alleen een plaatsnaam. Straat en huisnummer horen hier niet in. */
export function placeLabelFromAddress(address: CoarseAddress | undefined): string | null {
  if (!address) return null;
  const place =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.city_district ||
    address.suburb;
  if (!place) return null;
  if (address.state && address.state !== place) return `${place}, ${address.state}`;
  return place;
}

export function nearestPlaceLabel(lat: number, lng: number): string | null {
  let best: { name: string; km: number } | null = null;
  for (const city of CITY_CENTERS) {
    const km = haversineKm({ lat, lng }, { lat: city.lat, lng: city.lng });
    if (!best || km < best.km) best = { name: city.name, km };
  }
  if (!best || best.km > 40) return null;
  return `In de buurt van ${best.name}`;
}

const labelCache = new Map<string, { expires: number; label: string }>();

/** Plaatsnaam bij een grof afgerond punt. Het ruwe GPS-punt gaat niet naar de geocoder. */
export async function describePosition(lat: number, lng: number): Promise<string> {
  const coarseLat = Number(lat.toFixed(2));
  const coarseLng = Number(lng.toFixed(2));
  const key = `${coarseLat}:${coarseLng}`;
  const hit = labelCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.label;

  let label = nearestPlaceLabel(coarseLat, coarseLng) ?? "Je gedeelde locatie";
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(coarseLat));
    url.searchParams.set("lon", String(coarseLng));
    url.searchParams.set("zoom", "12");
    url.searchParams.set("accept-language", "nl");
    const response = await fetchWithTimeout(
      url.toString(),
      { headers: { "User-Agent": "RadVanAvontuur/0.1 (coarse place label)", "Accept-Language": "nl" } },
      3500,
    );
    if (response.ok) {
      const body = (await response.json()) as { address?: CoarseAddress };
      label = placeLabelFromAddress(body.address) ?? label;
    }
  } catch {
    // De interne plaatsenlijst blijft de naam.
  }
  labelCache.set(key, { expires: Date.now() + 60 * 60 * 1000, label });
  return label;
}

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
