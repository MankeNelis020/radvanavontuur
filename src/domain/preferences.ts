import { z } from "zod";
import type {
  AccessibilityNeed,
  GroupComposition,
  Interest,
  Origin,
  Participant,
  Scale,
  TransportMode,
} from "@/domain/types";
import { atAmsterdam } from "@/domain/time";

export const participantSchema = z.object({
  id: z.string().min(1).max(40),
  ageMonths: z.number().int().min(0).max(120 * 12),
});

export const originSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  label: z.string().min(1).max(120),
  source: z.enum(["geolocation", "geocoding", "gazetteer"]),
});

export const spinRequestSchema = z.object({
  mode: z.enum(["quick", "extended"]),
  participants: z.array(participantSchema).min(1).max(12),
  origin: originSchema,
  maxDistanceKm: z.number().gt(0).lte(200),
  groupComposition: z
    .enum(["family", "couple", "friends", "individual", "mixed", "unspecified"])
    .optional(),
  accessibility: z
    .array(z.enum(["wheelchair", "buggy", "stroller", "limitedWalking", "stairsFree"]))
    .max(5)
    .optional(),
  specificNeeds: z.string().max(500).optional().nullable(),
  allParticipantsMustFit: z.boolean().optional(),
  activityLevel: z.number().int().min(1).max(5).optional(),
  relaxationAdventure: z.number().int().min(1).max(5).optional(),
  environment: z.enum(["indoor", "outdoor", "both"]).optional(),
  interests: z.array(z.enum(["nature", "animals", "culture", "food", "sports", "water"])).max(6).optional(),
  surpriseLevel: z.number().int().min(1).max(5).optional(),
  transportation: z.enum(["car", "bicycle", "walking", "public_transport"]).nullable().optional(),
  availableTime: z
    .discriminatedUnion("kind", [
      z.object({ kind: z.literal("1-2") }),
      z.object({ kind: z.literal("half_day") }),
      z.object({ kind: z.literal("full_day") }),
      z.object({ kind: z.literal("custom"), minutes: z.number().int().min(30).max(24 * 60) }),
    ])
    .optional(),
  departure: z
    .discriminatedUnion("kind", [
      z.object({ kind: z.literal("asap") }),
      z.object({ kind: z.literal("later_today") }),
      z.object({ kind: z.literal("tomorrow") }),
      z.object({ kind: z.literal("custom"), iso: z.string().datetime() }),
    ])
    .optional(),
  budgetEur: z.number().min(0).max(10000).nullable().optional(),
  entranceFee: z.enum(["free_only", "prefer_free", "paid_ok"]).optional(),
  entranceLimitEur: z.number().min(0).max(10000).nullable().optional(),
  weatherPreference: z.enum(["any", "avoid_rain", "prefer_sun"]).optional(),
  completion: z.enum(["activity_only", "with_lunch", "with_lunch_and_stop"]).optional(),
  avoidVisited: z.boolean().optional(),
  visitedDestinationIds: z.array(z.string()).max(200).optional(),
});

export type SpinRequest = z.infer<typeof spinRequestSchema>;

export type ResolvedPreferences = {
  mode: "quick" | "extended";
  participants: Participant[];
  origin: Origin;
  maxDistanceKm: number;
  groupComposition: GroupComposition;
  accessibility: AccessibilityNeed[];
  specificNeeds: string | null;
  allParticipantsMustFit: boolean;
  activityLevel: Scale;
  relaxationAdventure: Scale;
  environment: "indoor" | "outdoor" | "both";
  interests: Interest[];
  surpriseLevel: Scale;
  transportation: TransportMode | null;
  availableMinutes: number;
  availableTimeLabel: string;
  arrival: Date;
  arrivalLabel: string;
  budgetEur: number | null;
  entranceFee: "free_only" | "prefer_free" | "paid_ok";
  entranceLimitEur: number | null;
  weatherPreference: "any" | "avoid_rain" | "prefer_sun";
  completion: "activity_only" | "with_lunch" | "with_lunch_and_stop";
  avoidVisited: boolean;
  visitedDestinationIds: string[];
  defaultsApplied: string[];
};

function asScale(value: number | undefined, fallback: Scale): Scale {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value;
  return fallback;
}

export function inferGroup(participants: Participant[]): GroupComposition {
  if (participants.length === 1) return "individual";
  const adults = participants.filter((person) => person.ageMonths >= 18 * 12).length;
  const children = participants.length - adults;
  if (children > 0 && adults > 0) return "family";
  if (participants.length === 2 && adults === 2) return "couple";
  if (adults === participants.length) return "friends";
  return "mixed";
}

export function resolvePreferences(input: SpinRequest, now: Date): ResolvedPreferences {
  const defaultsApplied: string[] = [];
  const quick = input.mode === "quick";

  const groupComposition = input.groupComposition ?? inferGroup(input.participants);
  if (!input.groupComposition) defaultsApplied.push("Groepssamenstelling is afgeleid uit de leeftijden.");

  if (quick || input.activityLevel === undefined) {
    defaultsApplied.push("Tempo staat op gebalanceerd (3 van 5).");
  }
  if (quick || input.relaxationAdventure === undefined) {
    defaultsApplied.push("De mix van rust en avontuur staat op gebalanceerd.");
  }
  if (quick || !input.environment) {
    defaultsApplied.push("Binnen en buiten zijn allebei toegestaan.");
  }
  if (quick || !input.transportation) {
    defaultsApplied.push("Geen vervoermiddel gekozen. We verzinnen geen reistijd.");
  }
  if (quick || !input.availableTime) {
    defaultsApplied.push("Beschikbare tijd staat op een halve dag.");
  }
  if (quick || !input.departure) {
    defaultsApplied.push("Vertrek staat op zo snel mogelijk.");
  }
  if (quick || input.budgetEur === undefined) {
    defaultsApplied.push("Geen maximumbudget.");
  }
  if (quick || !input.entranceFee) {
    defaultsApplied.push("Betaalde activiteiten zijn toegestaan. Onbekende prijzen blijven onbekend.");
  }

  const availableTime = input.availableTime ?? { kind: "half_day" as const };
  const availableMinutes =
    availableTime.kind === "1-2"
      ? 120
      : availableTime.kind === "half_day"
        ? 240
        : availableTime.kind === "full_day"
          ? 480
          : availableTime.minutes;
  const availableTimeLabel =
    availableTime.kind === "1-2"
      ? "1–2 uur"
      : availableTime.kind === "half_day"
        ? "Halve dag"
        : availableTime.kind === "full_day"
          ? "Hele dag"
          : `${availableMinutes} minuten`;

  const departure = input.departure ?? { kind: "asap" as const };
  let arrival = now;
  let arrivalLabel = "Zo snel mogelijk";
  if (departure.kind === "later_today") {
    arrival = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    arrivalLabel = "Later vandaag";
  } else if (departure.kind === "tomorrow") {
    arrival = atAmsterdam(now, 1, 10, 0);
    arrivalLabel = "Morgen";
  } else if (departure.kind === "custom") {
    arrival = new Date(departure.iso);
    arrivalLabel = "Zelf gekozen tijdstip";
  }

  const entranceFee = input.entranceFee ?? "paid_ok";
  let budgetEur = input.budgetEur === undefined ? null : input.budgetEur;
  let entranceLimitEur = input.entranceLimitEur === undefined ? null : input.entranceLimitEur;
  if (entranceFee === "free_only") entranceLimitEur = 0;
  if (budgetEur !== null && entranceLimitEur !== null) {
    entranceLimitEur = Math.min(budgetEur, entranceLimitEur);
  } else if (budgetEur !== null && entranceFee !== "paid_ok") {
    entranceLimitEur = budgetEur;
  } else if (budgetEur !== null && entranceLimitEur === null && entranceFee === "paid_ok") {
    entranceLimitEur = budgetEur;
  }

  return {
    mode: input.mode,
    participants: input.participants,
    origin: input.origin,
    maxDistanceKm: input.maxDistanceKm,
    groupComposition,
    accessibility: input.accessibility ?? [],
    specificNeeds: input.specificNeeds?.trim() ? input.specificNeeds.trim() : null,
    allParticipantsMustFit: input.allParticipantsMustFit ?? true,
    activityLevel: asScale(input.activityLevel, 3),
    relaxationAdventure: asScale(input.relaxationAdventure, 3),
    environment: input.environment ?? "both",
    interests: input.interests ?? [],
    surpriseLevel: asScale(input.surpriseLevel, 3),
    transportation: input.transportation ?? null,
    availableMinutes,
    availableTimeLabel,
    arrival,
    arrivalLabel,
    budgetEur,
    entranceFee,
    entranceLimitEur,
    weatherPreference: input.weatherPreference ?? "any",
    completion: input.completion ?? "activity_only",
    avoidVisited: input.avoidVisited ?? false,
    visitedDestinationIds: input.avoidVisited ? (input.visitedDestinationIds ?? []) : [],
    defaultsApplied,
  };
}
