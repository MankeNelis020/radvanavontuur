import { haversineKm } from "@/domain/geo";
import { groupEntranceCostEur } from "@/domain/pricing";
import type { EngineDestination } from "@/domain/types";
import type { ResolvedPreferences } from "@/domain/preferences";
import { checkOpeningHours, type HoursCheck } from "@/domain/engine/hours";
import { evaluateWeather, type WeatherDecision } from "@/domain/engine/weather-rules";
import type { WeatherSnapshot } from "@/domain/types";

export type Rejection = {
  code:
    | "radius"
    | "age"
    | "accessibility"
    | "budget"
    | "entrance"
    | "hours"
    | "transport"
    | "time"
    | "environment"
    | "weather"
    | "safety"
    | "visited";
  message: string;
};

export type ConstraintContext = {
  distanceKm: number;
  hours: HoursCheck;
  weather: WeatherDecision;
  entranceCost: number | null;
  travelMinutes: number | null;
};

const MODE_CAP_KM: Record<string, number> = {
  walking: 6,
  bicycle: 25,
};

export function evaluateConstraints(
  destination: EngineDestination,
  preferences: ResolvedPreferences,
  weather: WeatherSnapshot | null,
  travelMinutes: number | null,
): { ok: true; context: ConstraintContext } | { ok: false; rejection: Rejection; context: ConstraintContext } {
  const distanceKm = haversineKm(preferences.origin, {
    lat: destination.latitude,
    lng: destination.longitude,
  });
  const hours = checkOpeningHours(destination.openingHours, preferences.arrival, destination.estimatedDurationMinutes);
  const weatherDecision = evaluateWeather(
    destination,
    weather,
    preferences.participants,
    preferences.weatherPreference,
  );
  const entranceCost = groupEntranceCostEur(destination, preferences.participants);
  const context: ConstraintContext = {
    distanceKm,
    hours,
    weather: weatherDecision,
    entranceCost,
    travelMinutes,
  };

  const reject = (rejection: Rejection) => ({ ok: false as const, rejection, context });

  if (distanceKm > preferences.maxDistanceKm) {
    return reject({
      code: "radius",
      message: "Buiten de gekozen straal.",
    });
  }

  if (preferences.visitedDestinationIds.includes(destination.id)) {
    return reject({ code: "visited", message: "Eerder bezocht en daarom overgeslagen." });
  }

  if (destination.safetyRestrictions.length > 0) {
    return reject({
      code: "safety",
      message: "Veiligheidsbeperking in de catalogus.",
    });
  }

  const ages = preferences.participants.map((person) => person.ageMonths);
  const hasChild = ages.some((months) => months < 18 * 12);
  if (!destination.ageSuitabilityKnown && hasChild) {
    return reject({
      code: "age",
      message: "Leeftijdsgeschiktheid is onbekend en telt niet als geschikt voor kinderen.",
    });
  }
  const fits = (months: number) => {
    if (destination.minimumAgeMonths !== null && months < destination.minimumAgeMonths) return false;
    if (destination.maximumAgeMonths !== null && months > destination.maximumAgeMonths) return false;
    return true;
  };
  const fitCount = ages.filter(fits).length;
  if (preferences.allParticipantsMustFit && fitCount !== ages.length) {
    return reject({ code: "age", message: "Niet geschikt voor iedere deelnemer." });
  }
  if (!preferences.allParticipantsMustFit && fitCount === 0) {
    return reject({ code: "age", message: "Voor niemand in het gezelschap geschikt." });
  }

  for (const need of preferences.accessibility) {
    if (destination.accessibility[need] !== true) {
      return reject({
        code: "accessibility",
        message: "De gevraagde toegankelijkheid is niet bevestigd. Ontbrekende informatie telt niet als toegankelijk.",
      });
    }
  }

  if (preferences.environment === "indoor" && destination.environment === "outdoor") {
    return reject({ code: "environment", message: "Alleen binnen was gevraagd." });
  }
  if (preferences.environment === "outdoor" && destination.environment === "indoor") {
    return reject({ code: "environment", message: "Alleen buiten was gevraagd." });
  }

  const cap = preferences.transportation ? MODE_CAP_KM[preferences.transportation] : undefined;
  if (cap !== undefined && distanceKm > cap) {
    return reject({
      code: "transport",
      message: "Hemelsbreed al te ver voor het gekozen vervoermiddel. Er is geen verzonnen reistijd gebruikt.",
    });
  }

  if (destination.estimatedDurationMinutes > preferences.availableMinutes) {
    return reject({ code: "time", message: "Het bezoek zelf past niet in de beschikbare tijd." });
  }
  if (
    travelMinutes !== null &&
    destination.estimatedDurationMinutes + travelMinutes * 2 > preferences.availableMinutes
  ) {
    return reject({
      code: "time",
      message: "Inclusief de berekende heen- en terugreis past het niet in de tijd.",
    });
  }

  if (hours.status === "closed") {
    return reject({ code: "hours", message: hours.label });
  }

  const limit = preferences.entranceLimitEur;
  if (preferences.entranceFee === "free_only" && entranceCost !== 0) {
    return reject({
      code: "entrance",
      message:
        entranceCost === null
          ? "De prijs is onbekend en telt daarom niet als gratis."
          : "Betaalde entree valt buiten de keuze voor uitsluitend gratis.",
    });
  }
  if (limit !== null && (entranceCost === null || entranceCost > limit)) {
    return reject({
      code: limit === 0 ? "entrance" : "budget",
      message:
        entranceCost === null
          ? "De entree is onbekend en kan daardoor niet binnen het budget worden bevestigd."
          : "De bekende entree past niet in het budget.",
    });
  }

  if (!weatherDecision.eligible) {
    return reject({ code: "weather", message: weatherDecision.summary });
  }

  return { ok: true, context };
}
