import type { EngineDestination, OpeningHours } from "@/domain/types";
import type { PlacesProvider } from "@/providers/types";
import { fetchWithTimeout } from "@/providers/http";
import { haversineKm } from "@/domain/geo";

type GooglePeriod = {
  open?: { day?: number; hour?: number; minute?: number };
  close?: { day?: number; hour?: number; minute?: number };
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: { periods?: GooglePeriod[]; openNow?: boolean };
  photos?: { name?: string }[];
};

const INTEREST_BY_TYPE: Record<string, string> = {
  park: "nature",
  zoo: "animals",
  aquarium: "animals",
  museum: "culture",
  art_gallery: "culture",
  restaurant: "food",
  cafe: "food",
  stadium: "sports",
  beach: "water",
  marina: "water",
};

function hoursFromGoogle(place: GooglePlace, fetchedAt: string): OpeningHours | null {
  const periods = place.regularOpeningHours?.periods ?? [];
  if (periods.length === 0) return null;
  return {
    fetchedAt,
    source: "google_places",
    periods: periods
      .filter((period) => period.open?.day !== undefined && period.open.hour !== undefined)
      .map((period) => ({
        day: period.open?.day ?? 0,
        openMinutes: (period.open?.hour ?? 0) * 60 + (period.open?.minute ?? 0),
        closeMinutes: (period.close?.hour ?? 24) * 60 + (period.close?.minute ?? 0),
      })),
  };
}

function toCandidate(place: GooglePlace, fetchedAt: string): EngineDestination | null {
  if (!place.id || !place.displayName?.text || place.location?.latitude === undefined || place.location.longitude === undefined) {
    return null;
  }
  const interests = Array.from(
    new Set((place.types ?? []).map((type) => INTEREST_BY_TYPE[type]).filter((value): value is string => Boolean(value))),
  );
  return {
    id: `google:${place.id}`,
    name: place.displayName.text,
    category: place.types?.[0] ?? "plaats",
    interests,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    address: place.formattedAddress ?? "Adres niet meegeleverd",
    locality: "",
    description: "Gevonden via Google Places. Leeftijd, prijs en toegankelijkheid zijn niet uit deze bron afgeleid.",
    minimumAgeMonths: null,
    maximumAgeMonths: null,
    ageSuitabilityKnown: false,
    ageSuitabilityNote: "Leeftijdsgeschiktheid is onbekend. Met kinderen valt deze plek daarom af.",
    accessibility: {
      wheelchair: null,
      buggy: null,
      stroller: null,
      limitedWalking: null,
      stairsFree: null,
    },
    activityLevel: 3,
    relaxationAdventure: 3,
    environment: interests.includes("nature") || interests.includes("water") ? "outdoor" : "both",
    familiarity: 4,
    estimatedDurationMinutes: 120,
    entrance: { model: "unknown", note: "Google Places levert hier geen betrouwbare entreeprijs." },
    openingHours: hoursFromGoogle(place, fetchedAt),
    providerPlaceId: place.id,
    website: place.websiteUri ?? null,
    imageUrl: null,
    sourceUrl: place.googleMapsUri ?? null,
    coordinateSource: "Google Places",
    verificationStatus: "provider",
    safetyRestrictions: [],
  };
}

export function createPlacesProvider(): PlacesProvider {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      mode: "unavailable",
      label: "Google Places is niet geconfigureerd",
      async enrich({ catalog }) {
        return {
          destinations: catalog,
          requests: 0,
          note: "Externe plaatsendatabase is niet geconfigureerd. Aanbevelingen komen uit de eigen catalogus.",
        };
      },
    };
  }

  return {
    mode: "live",
    label: "Google Places",
    async enrich({ origin, radiusMeters, catalog }) {
      const radius = Math.min(Math.max(radiusMeters, 500), 50000);
      const response = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.googleMapsUri,places.regularOpeningHours",
        },
        body: JSON.stringify({
          includedTypes: ["tourist_attraction", "museum", "park", "zoo", "aquarium"],
          maxResultCount: 10,
          rankPreference: "DISTANCE",
          locationRestriction: {
            circle: {
              center: { latitude: origin.lat, longitude: origin.lng },
              radius,
            },
          },
        }),
      });
      if (!response.ok) {
        return {
          destinations: catalog,
          requests: 1,
          note: "Google Places reageerde niet bruikbaar. De eigen catalogus is gebruikt.",
        };
      }
      const body = (await response.json()) as { places?: GooglePlace[] };
      const fetchedAt = new Date().toISOString();
      const remote = (body.places ?? [])
        .map((place) => toCandidate(place, fetchedAt))
        .filter((place): place is EngineDestination => place !== null);
      const merged = catalog.map((destination) => {
        const match = remote.find((place) => {
          const near =
            haversineKm(
              { lat: destination.latitude, lng: destination.longitude },
              { lat: place.latitude, lng: place.longitude },
            ) < 0.25;
          const named = place.name.toLowerCase().includes(destination.name.toLowerCase().slice(0, 6));
          return near && named;
        });
        if (!match) return destination;
        return {
          ...destination,
          providerPlaceId: match.providerPlaceId,
          openingHours: match.openingHours ?? destination.openingHours,
          website: destination.website ?? match.website,
          sourceUrl: destination.sourceUrl,
        };
      });
      const knownIds = new Set(merged.map((destination) => destination.providerPlaceId).filter(Boolean));
      const additions = remote.filter((place) => !knownIds.has(place.providerPlaceId));
      return {
        destinations: [...merged, ...additions],
        requests: 1,
        note: "Google Places is bevraagd voor een korte lijst. Leeftijd en prijs blijven leeg als de catalogus ze niet kent.",
      };
    },
  };
}
