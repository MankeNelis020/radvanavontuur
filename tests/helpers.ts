import type { EngineDestination } from "@/domain/types";
import { resolvePreferences, type SpinRequest } from "@/domain/preferences";

export function destination(overrides: Partial<EngineDestination> = {}): EngineDestination {
  return {
    id: "test-plek",
    name: "Testplek",
    category: "museum",
    interests: ["culture"],
    latitude: 52.09,
    longitude: 5.12,
    address: "Teststraat 1",
    locality: "Utrecht",
    description: "Testbestemming.",
    minimumAgeMonths: 0,
    maximumAgeMonths: null,
    ageSuitabilityKnown: true,
    ageSuitabilityNote: "Testdata.",
    accessibility: {
      wheelchair: null,
      buggy: null,
      stroller: null,
      limitedWalking: null,
      stairsFree: null,
    },
    activityLevel: 3,
    relaxationAdventure: 3,
    environment: "indoor",
    familiarity: 3,
    estimatedDurationMinutes: 90,
    entrance: { model: "unknown", note: "onbekend" },
    openingHours: null,
    providerPlaceId: null,
    website: null,
    imageUrl: null,
    sourceUrl: null,
    coordinateSource: "test",
    verificationStatus: "editorial",
    safetyRestrictions: [],
    ...overrides,
  };
}

export function preferences(overrides: Partial<SpinRequest> = {}) {
  return resolvePreferences(
    {
      mode: "extended",
      participants: [{ id: "a", ageMonths: 30 * 12 }],
      origin: { lat: 52.09083, lng: 5.12222, label: "Utrecht", source: "gazetteer" },
      maxDistanceKm: 30,
      ...overrides,
    },
    new Date("2026-06-15T10:00:00.000Z"),
  );
}
