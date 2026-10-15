import type { EngineDestination, RespinReason, Scale } from "@/domain/types";
import type { ResolvedPreferences } from "@/domain/preferences";

export const MIN_WEIGHT = 0.05;
export const SCORE_EXPONENT = 1.6;

/**
 * Selectiegewicht: w = 0,05 + s^1,6
 * Kans: P(i) = w_i / som(w)
 * s is een niet-commerciële geschiktheidsscore tussen 0 en 1.
 */
export function weightFromScore(score: number): number {
  const clamped = Math.min(1, Math.max(0, score));
  return MIN_WEIGHT + clamped ** SCORE_EXPONENT;
}

function closeness(preferred: Scale, actual: Scale): number {
  return 1 - Math.abs(preferred - actual) / 4;
}

export function suitabilityScore(
  destination: EngineDestination,
  preferences: ResolvedPreferences,
  weatherMultiplier: number,
): number {
  const interestScore = (() => {
    if (preferences.interests.length === 0) return 0.7;
    const matches = destination.interests.filter((interest) =>
      preferences.interests.includes(interest as (typeof preferences.interests)[number]),
    ).length;
    if (matches === 0) return 0.15;
    return 0.45 + 0.55 * (matches / preferences.interests.length);
  })();

  const environmentScore =
    preferences.environment === "both" || preferences.environment === destination.environment
      ? 1
      : destination.environment === "both"
        ? 0.85
        : 0.25;

  const freeScore = (() => {
    if (preferences.entranceFee !== "prefer_free") return 0.8;
    if (destination.entrance.model === "free") return 1;
    if (destination.entrance.model === "unknown") return 0.45;
    return 0.3;
  })();

  const surpriseScore = closeness(preferences.surpriseLevel, destination.familiarity);

  const score =
    interestScore * 0.3 +
    closeness(preferences.activityLevel, destination.activityLevel) * 0.18 +
    closeness(preferences.relaxationAdventure, destination.relaxationAdventure) * 0.18 +
    environmentScore * 0.14 +
    surpriseScore * 0.12 +
    freeScore * 0.08;

  return Math.min(1, Math.max(0, score * weatherMultiplier));
}

export function respinMultiplier(
  destination: EngineDestination,
  preferences: ResolvedPreferences,
  distanceKm: number,
  reason: RespinReason | null,
  previous: { category: string; environment: EngineDestination["environment"] } | null,
): number {
  if (!reason || !previous) return 1;
  if (reason === "not_appealing" && destination.category === previous.category) return 0.2;
  if (reason === "want_different" && destination.category === previous.category) return 0.15;
  if (reason === "not_practical") {
    const far = distanceKm > preferences.maxDistanceKm * 0.6;
    const long = destination.estimatedDurationMinutes > preferences.availableMinutes * 0.7;
    if (far || long) return 0.25;
  }
  if (reason === "other" && destination.familiarity >= 4) return 1.25;
  return 1;
}
