export const INTERESTS = ["nature", "animals", "culture", "food", "sports", "water"] as const;
export type Interest = (typeof INTERESTS)[number];

export const ACCESSIBILITY_NEEDS = [
  "wheelchair",
  "buggy",
  "stroller",
  "limitedWalking",
  "stairsFree",
] as const;
export type AccessibilityNeed = (typeof ACCESSIBILITY_NEEDS)[number];

export type Accessibility = Record<AccessibilityNeed, boolean | null>;

export type Environment = "indoor" | "outdoor" | "both";
export type Scale = 1 | 2 | 3 | 4 | 5;

export type AgePrice = {
  minMonths: number;
  maxMonths: number;
  amountEur: number;
};

export type Entrance =
  | { model: "free"; note: string }
  | { model: "unknown"; note: string }
  | {
      model: "per_person";
      amountEur: number;
      note: string;
      agePrices?: AgePrice[];
    }
  | { model: "per_group"; amountEur: number; note: string };

export type OpeningPeriod = {
  /** 0 = zondag, zoals Google Places. */
  day: number;
  openMinutes: number;
  closeMinutes: number;
};

export type OpeningHours = {
  periods: OpeningPeriod[];
  alwaysOpen?: boolean;
  /** Wanneer de uren zijn opgehaald. Null betekent: niet live gecontroleerd. */
  fetchedAt: string | null;
  source: "google_places" | "catalog" | "unknown";
};

export type EngineDestination = {
  id: string;
  name: string;
  category: string;
  interests: string[];
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  description: string;
  minimumAgeMonths: number | null;
  maximumAgeMonths: number | null;
  ageSuitabilityKnown: boolean;
  ageSuitabilityNote: string;
  accessibility: Accessibility;
  activityLevel: Scale;
  relaxationAdventure: Scale;
  environment: Environment;
  /** 1 = iconisch en bekend, 5 = weinig bekend. */
  familiarity: Scale;
  estimatedDurationMinutes: number;
  entrance: Entrance;
  openingHours: OpeningHours | null;
  providerPlaceId: string | null;
  website: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  coordinateSource: string;
  verificationStatus: "editorial" | "provider" | "verified";
  safetyRestrictions: string[];
};

export type WeatherStatus = "live" | "cached" | "fixture" | "unavailable";

export type WeatherSnapshot = {
  status: WeatherStatus;
  observedAt: string | null;
  validFor: string | null;
  temperatureC: number | null;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
  /** Open-Meteo levert geen officiële KNMI-waarschuwing. */
  officialWarningChecked: false;
  summaryNl: string;
};

export type Participant = {
  id: string;
  ageMonths: number;
};

export type TransportMode = "car" | "bicycle" | "walking" | "public_transport";

export type RespinReason =
  | "been_there"
  | "not_appealing"
  | "not_practical"
  | "want_different"
  | "other";

export type VisitStatus =
  | "suggested"
  | "accepted"
  | "route_opened"
  | "visit_self_confirmed"
  | "not_visited";

export type GroupComposition =
  | "family"
  | "couple"
  | "friends"
  | "individual"
  | "mixed"
  | "unspecified";

export type LocationSource = "geolocation" | "geocoding" | "gazetteer";

export type Origin = {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
};

export const COMMERCIAL_KEYS = [
  "partnerstatus",
  "partner_status",
  "affiliatecommission",
  "affiliate_commission",
  "commission",
  "discountpercentage",
  "discount_percentage",
  "discountvalue",
  "discount_value",
  "promotion",
  "promotions",
  "promotionavailable",
  "promotion_available",
  "advertisingspend",
  "advertising_spend",
  "adspend",
  "ad_spend",
  "promotionalbudget",
  "promotional_budget",
  "affiliate",
  "sponsor",
  "sponsored",
] as const;

const COMMERCIAL_KEY_SET = new Set<string>(COMMERCIAL_KEYS);

export function assertNoCommercialFields(value: unknown, path = "bestemming"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoCommercialFields(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (COMMERCIAL_KEY_SET.has(key.toLowerCase())) {
      throw new Error(`Commercieel veld geweigerd in de aanbevelingsmotor (${path}.${key}).`);
    }
  }
}
