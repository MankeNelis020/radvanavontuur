import { detourKm, haversineKm } from "@/domain/geo";
import { groupEntranceCostEur } from "@/domain/pricing";
import type { EngineDestination, Participant } from "@/domain/types";
import { rngFromSeed, weightedIndex } from "@/domain/engine/random";
import { weightFromScore } from "@/domain/engine/scoring";

export type SidePick = {
  destination: EngineDestination;
  distanceFromMainKm: number;
  reason: string;
};

function accessOk(destination: EngineDestination, needs: EngineDestination["accessibility"] extends never ? never : string[], required: string[]): boolean {
  for (const need of required) {
    const value = destination.accessibility[need as keyof EngineDestination["accessibility"]];
    if (value !== true) return false;
  }
  return true;
}

export function pickLunch(input: {
  main: EngineDestination;
  options: EngineDestination[];
  participants: Participant[];
  accessibility: string[];
  remainingBudgetEur: number | null;
  seed: string;
}): SidePick | null {
  const eligible = input.options.filter((option) => {
    if (option.id === input.main.id) return false;
    if (haversineKm({ lat: input.main.latitude, lng: input.main.longitude }, { lat: option.latitude, lng: option.longitude }) > 8) return false;
    if (!accessOk(option, [], input.accessibility)) return false;
    const hasChild = input.participants.some((person) => person.ageMonths < 18 * 12);
    if (hasChild && !option.ageSuitabilityKnown) return false;
    const cost = groupEntranceCostEur(option, input.participants);
    if (input.remainingBudgetEur !== null && (cost === null || cost > input.remainingBudgetEur)) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  const weights = eligible.map((option) => {
    const distance = haversineKm(
      { lat: input.main.latitude, lng: input.main.longitude },
      { lat: option.latitude, lng: option.longitude },
    );
    const near = 1 - Math.min(distance, 8) / 8;
    return weightFromScore(0.4 + near * 0.6);
  });
  const index = weightedIndex(weights, rngFromSeed(input.seed));
  const destination = eligible[index];
  if (!destination) return null;
  const distanceFromMainKm = haversineKm(
    { lat: input.main.latitude, lng: input.main.longitude },
    { lat: destination.latitude, lng: destination.longitude },
  );
  return {
    destination,
    distanceFromMainKm,
    reason: `Lunchpunt hemelsbreed ${distanceFromMainKm.toFixed(1).replace(".", ",")} km van het avontuur. Openingstijden en wachttijd zijn niet live gecontroleerd.`,
  };
}

export function pickReturnStop(input: {
  origin: { lat: number; lng: number };
  main: EngineDestination;
  options: EngineDestination[];
  participants: Participant[];
  accessibility: string[];
  remainingBudgetEur: number | null;
  remainingMinutes: number;
  seed: string;
  blockedIds: string[];
}): SidePick | null {
  const blocked = new Set(input.blockedIds);
  const eligible = input.options.filter((option) => {
    if (blocked.has(option.id) || option.id === input.main.id) return false;
    if (!accessOk(option, [], input.accessibility)) return false;
    const hasChild = input.participants.some((person) => person.ageMonths < 18 * 12);
    if (hasChild && !option.ageSuitabilityKnown) return false;
    if (option.estimatedDurationMinutes > input.remainingMinutes) return false;
    const stopPoint = { lat: option.latitude, lng: option.longitude };
    const fromOrigin = haversineKm(input.origin, stopPoint);
    const fromMain = haversineKm({ lat: input.main.latitude, lng: input.main.longitude }, stopPoint);
    if (fromOrigin < 0.75 || fromMain < 0.4) return false;
    const extra = detourKm(input.origin, { lat: input.main.latitude, lng: input.main.longitude }, stopPoint);
    const direct = haversineKm(
      { lat: input.main.latitude, lng: input.main.longitude },
      input.origin,
    );
    const allowance = Math.min(8, Math.max(2, direct * 0.35));
    if (extra > allowance) return false;
    const cost = groupEntranceCostEur(option, input.participants);
    if (input.remainingBudgetEur !== null && (cost === null || cost > input.remainingBudgetEur)) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  const weights = eligible.map((option) => {
    const extra = detourKm(input.origin, { lat: input.main.latitude, lng: input.main.longitude }, {
      lat: option.latitude,
      lng: option.longitude,
    });
    return weightFromScore(1 - Math.min(extra, 8) / 8);
  });
  const index = weightedIndex(weights, rngFromSeed(input.seed));
  const destination = eligible[index];
  if (!destination) return null;
  const extra = detourKm(input.origin, { lat: input.main.latitude, lng: input.main.longitude }, {
    lat: destination.latitude,
    lng: destination.longitude,
  });
  return {
    destination,
    distanceFromMainKm: extra,
    reason: `Tussenstop met ongeveer ${extra.toFixed(1).replace(".", ",")} km extra hemelsbreed. Dat is geen reistijd.`,
  };
}
