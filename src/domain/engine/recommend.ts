import { formatKm } from "@/domain/geo";
import { formatEntrance } from "@/domain/pricing";
import type { ResolvedPreferences } from "@/domain/preferences";
import { assertNoCommercialFields, type EngineDestination, type RespinReason, type WeatherSnapshot } from "@/domain/types";
import { evaluateConstraints } from "@/domain/engine/constraints";
import { rngFromSeed, weightedIndex } from "@/domain/engine/random";
import { respinMultiplier, suitabilityScore, weightFromScore } from "@/domain/engine/scoring";
import { buildWheelSegments, type WheelSegment } from "@/domain/engine/wheel";

export type CandidateAssessment = {
  destination: EngineDestination;
  distanceKm: number;
  score: number;
  weight: number;
  probability: number;
  weather: WeatherSnapshot | null;
  weatherSummary: string;
  hoursLabel: string;
  hoursStatus: "open" | "closed" | "unknown";
  travelMinutes: number | null;
};

export type RecommendationSuccess = {
  ok: true;
  winner: CandidateAssessment;
  candidates: CandidateAssessment[];
  wheel: WheelSegment[];
  explanation: string[];
  seed: string;
};

export type RecommendationFailure = {
  ok: false;
  reason: "empty";
  summary: string;
  rejected: { id: string; message: string }[];
};

export type Recommendation = RecommendationSuccess | RecommendationFailure;

export type RecommendInput = {
  destinations: EngineDestination[];
  preferences: ResolvedPreferences;
  weatherById: Record<string, WeatherSnapshot | null>;
  travelMinutesById?: Record<string, number | null>;
  seed: string;
  excludeIds?: string[];
  respinReason?: RespinReason | null;
  previous?: { category: string; environment: EngineDestination["environment"] } | null;
};

const SHORTLIST_LIMIT = 12;

export function recommend(input: RecommendInput): Recommendation {
  assertNoCommercialFields(input.destinations);
  const excluded = new Set(input.excludeIds ?? []);
  const rejected: { id: string; message: string }[] = [];
  const preliminary: {
    destination: EngineDestination;
    distanceKm: number;
    score: number;
    weather: WeatherSnapshot | null;
    weatherSummary: string;
    hoursLabel: string;
    hoursStatus: "open" | "closed" | "unknown";
    travelMinutes: number | null;
  }[] = [];

  for (const destination of input.destinations) {
    if (excluded.has(destination.id)) {
      rejected.push({ id: destination.id, message: "Buiten deze draai gehouden." });
      continue;
    }
    const decision = evaluateConstraints(
      destination,
      input.preferences,
      input.weatherById[destination.id] ?? null,
      input.travelMinutesById?.[destination.id] ?? null,
    );
    if (!decision.ok) {
      rejected.push({ id: destination.id, message: decision.rejection.message });
      continue;
    }
    const score = suitabilityScore(destination, input.preferences, decision.context.weather.multiplier);
    preliminary.push({
      destination,
      distanceKm: decision.context.distanceKm,
      score,
      weather: input.weatherById[destination.id] ?? null,
      weatherSummary: decision.context.weather.summary,
      hoursLabel: decision.context.hours.label,
      hoursStatus: decision.context.hours.status,
      travelMinutes: decision.context.travelMinutes,
    });
  }

  preliminary.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm || a.destination.id.localeCompare(b.destination.id));
  const shortlist = preliminary.slice(0, SHORTLIST_LIMIT);
  if (shortlist.length === 0) {
    return {
      ok: false,
      reason: "empty",
      summary: "Geen bestemming voldoet aan je harde grenzen. Er is niets verzonnen.",
      rejected: rejected.slice(0, 8),
    };
  }

  const weighted = shortlist.map((candidate) => {
    const reasonFactor = respinMultiplier(
      candidate.destination,
      input.preferences,
      candidate.distanceKm,
      input.respinReason ?? null,
      input.previous ?? null,
    );
    return {
      ...candidate,
      weight: weightFromScore(candidate.score) * reasonFactor,
    };
  });
  const totalWeight = weighted.reduce((sum, candidate) => sum + candidate.weight, 0);
  const withProbability: CandidateAssessment[] = weighted.map((candidate) => ({
    destination: candidate.destination,
    distanceKm: candidate.distanceKm,
    score: candidate.score,
    weight: candidate.weight,
    probability: candidate.weight / totalWeight,
    weather: candidate.weather,
    weatherSummary: candidate.weatherSummary,
    hoursLabel: candidate.hoursLabel,
    hoursStatus: candidate.hoursStatus,
    travelMinutes: candidate.travelMinutes,
  }));

  const rng = rngFromSeed(input.seed);
  const index = weightedIndex(
    withProbability.map((candidate) => candidate.weight),
    rng,
  );
  const winner = withProbability[index];
  if (!winner) {
    return {
      ok: false,
      reason: "empty",
      summary: "De selectie leverde geen bestemming op.",
      rejected,
    };
  }

  const wheel = buildWheelSegments(
    withProbability.map((candidate) => ({
      id: candidate.destination.id,
      label: candidate.destination.name,
      weight: candidate.weight,
    })),
    winner.destination.id,
  );

  return {
    ok: true,
    winner,
    candidates: withProbability,
    wheel,
    seed: input.seed,
    explanation: explain(winner, input.preferences, withProbability.length),
  };
}

function explain(
  winner: CandidateAssessment,
  preferences: ResolvedPreferences,
  poolSize: number,
): string[] {
  const entrance = formatEntrance(winner.destination, preferences.participants);
  const chance = `${Math.round(winner.probability * 100)}%`;
  const lines = [
    `${winner.destination.name} ligt hemelsbreed ${formatKm(winner.distanceKm)} van je startpunt, binnen de straal van ${formatKm(preferences.maxDistanceKm)}.`,
    winner.destination.ageSuitabilityNote,
    winner.weatherSummary,
    winner.hoursLabel,
    entrance.label,
    `Dit is geen gelijke loting. Het selectiegewicht volgt de geschiktheid. In deze ronde had deze bestemming ongeveer ${chance} kans binnen ${poolSize} ${poolSize === 1 ? "kandidaat" : "kandidaten"}.`,
  ];
  if (preferences.interests.length > 0) {
    const matched = winner.destination.interests.filter((interest) =>
      preferences.interests.includes(interest as (typeof preferences.interests)[number]),
    );
    if (matched.length > 0) {
      lines.splice(2, 0, "De interesses sluiten aan op wat je aangaf.");
    }
  }
  if (winner.travelMinutes === null) {
    lines.push("Reistijd is niet berekend, omdat de routeprovider geen resultaat gaf of niet is geconfigureerd.");
  } else {
    lines.push(`Geschatte reistijd enkele reis: ${winner.travelMinutes} minuten, via de routeprovider.`);
  }
  if (preferences.specificNeeds) {
    lines.push("Je specifieke behoeften zijn alleen voor jou bewaard en hebben de selectie niet automatisch gefilterd.");
  }
  return lines;
}

export { SHORTLIST_LIMIT };
