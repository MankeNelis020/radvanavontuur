import type { EngineDestination, Participant, WeatherSnapshot } from "@/domain/types";

const SEVERE_CODES = new Set([65, 67, 75, 82, 86, 95, 96, 97, 99]);
const HEAVY_CODES = new Set([63, 65, 67, 55, 81, 82]);
const LIGHT_CODES = new Set([51, 53, 61, 80, 56]);

export type WeatherDecision = {
  eligible: boolean;
  multiplier: number;
  summary: string;
};

function heavy(snapshot: WeatherSnapshot): boolean {
  if (snapshot.weatherCode !== null && (SEVERE_CODES.has(snapshot.weatherCode) || HEAVY_CODES.has(snapshot.weatherCode))) {
    return true;
  }
  return snapshot.precipitationMm !== null && snapshot.precipitationMm >= 2;
}

function light(snapshot: WeatherSnapshot): boolean {
  if (heavy(snapshot)) return false;
  if (snapshot.weatherCode !== null && LIGHT_CODES.has(snapshot.weatherCode)) return true;
  return (
    snapshot.precipitationProbability !== null &&
    snapshot.precipitationProbability >= 50 &&
    snapshot.precipitationMm !== null &&
    snapshot.precipitationMm > 0 &&
    snapshot.precipitationMm < 2
  );
}

export function evaluateWeather(
  destination: EngineDestination,
  snapshot: WeatherSnapshot | null,
  participants: Participant[],
  preference: "any" | "avoid_rain" | "prefer_sun",
): WeatherDecision {
  if (!snapshot || snapshot.status === "unavailable") {
    return {
      eligible: true,
      multiplier: 1,
      summary:
        "Het weer op de bestemming is niet opgehaald. Buitenactiviteiten zijn daarom niet op het weer gecontroleerd, en er is geen officiële weerwaarschuwing geverifieerd.",
    };
  }

  const severe = snapshot.weatherCode !== null && SEVERE_CODES.has(snapshot.weatherCode);
  const isHeavy = heavy(snapshot);
  const isLight = light(snapshot);
  const baby = participants.some((person) => person.ageMonths < 24);
  const senior = participants.some((person) => person.ageMonths >= 75 * 12);
  const temp = snapshot.temperatureC;
  const wind = snapshot.windSpeedKmh;
  const outdoor = destination.environment === "outdoor";
  const indoor = destination.environment === "indoor";

  if (outdoor && severe) {
    return {
      eligible: false,
      multiplier: 0,
      summary: "De buitenbestemming valt af door zware neerslag of onweer in de modelverwachting. Dit is geen officiële KNMI-waarschuwing.",
    };
  }
  if (outdoor && isHeavy) {
    return {
      eligible: false,
      multiplier: 0,
      summary: "Stevige regen maakt deze volledig buitenactiviteit ongeschikt. Lichte regen sluit buiten niet automatisch uit.",
    };
  }
  if (outdoor && wind !== null && wind >= 75) {
    return {
      eligible: false,
      multiplier: 0,
      summary: "De wind op de bestemming is te fors voor een volledig buitenbezoek.",
    };
  }
  if (outdoor && baby && temp !== null && temp < 3) {
    return {
      eligible: false,
      multiplier: 0,
      summary: "Met een baby onder de twee jaar valt langdurig buiten af bij temperaturen onder 3 °C.",
    };
  }
  if (outdoor && senior && temp !== null && temp < -2) {
    return {
      eligible: false,
      multiplier: 0,
      summary: "Bij vorst onder -2 °C valt een volledig buitenbezoek af voor een oudere deelnemer.",
    };
  }

  let multiplier = 1;
  if (outdoor && isLight) multiplier *= 0.72;
  if (destination.environment === "both" && isHeavy) multiplier *= 0.7;
  if (destination.environment === "both" && isLight) multiplier *= 0.9;
  if (indoor && (isHeavy || severe)) multiplier *= 1.22;
  if (indoor && !isHeavy && !isLight && temp !== null && temp >= 12 && temp <= 24) multiplier *= 0.94;
  if (outdoor && !isLight && !isHeavy && temp !== null && temp >= 8 && temp <= 26) multiplier *= 1.08;
  if (preference === "avoid_rain" && (isLight || (snapshot.precipitationProbability ?? 0) >= 40) && !indoor) {
    multiplier *= 0.45;
  }
  if (preference === "prefer_sun" && outdoor && !isLight && !isHeavy) multiplier *= 1.12;

  const tempText = temp === null ? "temperatuur onbekend" : `${Math.round(temp)} °C`;
  const rainText =
    snapshot.precipitationProbability === null
      ? "neerslagkans onbekend"
      : `${Math.round(snapshot.precipitationProbability)}% kans op neerslag`;
  const tone = isHeavy
    ? "Het wordt nat."
    : isLight
      ? "Er valt lichte regen. Dat sluit een buitenbestemming niet uit, maar het weegt wel mee."
      : "Het weer werkt niet tegen.";

  return {
    eligible: true,
    multiplier,
    summary: `${tone} Op de bestemming: ${tempText}, ${rainText}. Officiële weerwaarschuwingen zijn niet gecontroleerd.`,
  };
}

export function weatherCodeLabel(code: number | null): string {
  if (code === null) return "onbekend";
  if (code === 0) return "helder";
  if (code <= 3) return "bewolkt";
  if (code === 45 || code === 48) return "mist";
  if (LIGHT_CODES.has(code)) return "lichte regen";
  if (HEAVY_CODES.has(code) || code === 65) return "stevige regen";
  if (code >= 95) return "onweer";
  if (code >= 71) return "winterse neerslag";
  return "wisselvallig";
}
