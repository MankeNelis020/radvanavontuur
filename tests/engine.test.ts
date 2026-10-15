import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { haversineKm } from "@/domain/geo";
import { checkOpeningHours } from "@/domain/engine/hours";
import { recommend } from "@/domain/engine/recommend";
import { hashSeed, mulberry32, weightedIndex } from "@/domain/engine/random";
import { weightFromScore } from "@/domain/engine/scoring";
import { buildWheelSegments, rotationForWinner } from "@/domain/engine/wheel";
import { evaluateWeather } from "@/domain/engine/weather-rules";
import { groupEntranceCostEur } from "@/domain/pricing";
import { assertNoCommercialFields } from "@/domain/types";
import type { WeatherSnapshot } from "@/domain/types";
import { amsterdamParts } from "@/domain/time";
import { destination, preferences } from "./helpers";

function weather(partial: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    status: "live",
    observedAt: "2026-06-15T10:00:00.000Z",
    validFor: "2026-06-15T12:00",
    temperatureC: 18,
    precipitationProbability: 10,
    precipitationMm: 0,
    windSpeedKmh: 12,
    weatherCode: 1,
    officialWarningChecked: false,
    summaryNl: "Droog.",
    ...partial,
  };
}

describe("aanbevelingsmotor", () => {
  it("houdt bestemmingen buiten de straal tegen", () => {
    const near = destination({ id: "dichtbij", latitude: 52.1, longitude: 5.13 });
    const far = destination({ id: "ver", name: "Ver weg", latitude: 53.2, longitude: 6.5 });
    const result = recommend({
      destinations: [near, far],
      preferences: preferences({ maxDistanceKm: 15 }),
      weatherById: {},
      seed: "straal",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates.map((candidate) => candidate.destination.id)).toEqual(["dichtbij"]);
  });

  it("filtert op leeftijd en behandelt onbekende geschiktheid niet als kindvriendelijk", () => {
    const adultOnly = destination({ id: "volwassen", minimumAgeMonths: 18 * 12 });
    const unknown = destination({ id: "onbekend", ageSuitabilityKnown: false, minimumAgeMonths: null });
    const result = recommend({
      destinations: [adultOnly, unknown],
      preferences: preferences({
        participants: [
          { id: "ouder", ageMonths: 34 * 12 },
          { id: "kind", ageMonths: 4 * 12 },
        ],
      }),
      weatherById: {},
      seed: "leeftijd",
    });
    expect(result.ok).toBe(false);
  });

  it("eist bevestigde toegankelijkheid", () => {
    const unknown = destination({ id: "onbekend" });
    const ready = destination({
      id: "klaar",
      accessibility: {
        wheelchair: true,
        buggy: null,
        stroller: null,
        limitedWalking: null,
        stairsFree: null,
      },
    });
    const result = recommend({
      destinations: [unknown, ready],
      preferences: preferences({ accessibility: ["wheelchair"] }),
      weatherById: {},
      seed: "toegang",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.winner.destination.id).toBe("klaar");
  });

  it("leest een onbekende prijs niet als gratis", () => {
    const priced = destination({
      id: "betaald",
      entrance: { model: "per_person", amountEur: 12, note: "bekend" },
    });
    expect(groupEntranceCostEur(priced, [{ id: "a", ageMonths: 120 }, { id: "b", ageMonths: 400 }])).toBe(24);
    const unknown = destination({ id: "onbekend" });
    const free = destination({ id: "gratis", entrance: { model: "free", note: "park" } });
    const result = recommend({
      destinations: [priced, unknown, free],
      preferences: preferences({ entranceFee: "free_only", budgetEur: 0 }),
      weatherById: {},
      seed: "gratis",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.winner.destination.id).toBe("gratis");
  });

  it("houdt een entreelimiet aan en laat een onbekende prijs vallen", () => {
    const cheap = destination({
      id: "goedkoop",
      entrance: { model: "per_group", amountEur: 20, note: "bekend" },
    });
    const unknown = destination({ id: "onbekend" });
    const result = recommend({
      destinations: [cheap, unknown],
      preferences: preferences({ entranceFee: "paid_ok", entranceLimitEur: 25, budgetEur: null }),
      weatherById: {},
      seed: "limiet",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates).toHaveLength(1);
    expect(result.winner.destination.id).toBe("goedkoop");
  });

  it("sluit zware regen voor buiten uit en laat lichte regen toe", () => {
    const park = destination({ id: "park", environment: "outdoor", interests: ["nature"] });
    const heavy = evaluateWeather(park, weather({ weatherCode: 65, precipitationMm: 4 }), preferences().participants, "any");
    const light = evaluateWeather(park, weather({ weatherCode: 61, precipitationMm: 0.4, precipitationProbability: 60 }), preferences().participants, "any");
    expect(heavy.eligible).toBe(false);
    expect(light.eligible).toBe(true);
    expect(light.multiplier).toBeLessThan(1);
  });

  it("gebruikt openingstijden alleen als ze bekend zijn", () => {
    const arrival = new Date("2026-06-15T10:00:00.000Z");
    const day = amsterdamParts(arrival).weekday;
    const closed = checkOpeningHours(
      {
        source: "catalog",
        fetchedAt: null,
        periods: [{ day, openMinutes: 18 * 60, closeMinutes: 21 * 60 }],
      },
      arrival,
      60,
    );
    expect(closed.status).toBe("closed");
    expect(checkOpeningHours(null, arrival, 60).status).toBe("unknown");
    const open = destination({
      id: "open",
      openingHours: {
        source: "google_places",
        fetchedAt: "2026-06-15T09:00:00.000Z",
        periods: [{ day, openMinutes: 9 * 60, closeMinutes: 17 * 60 }],
      },
    });
    const shut = destination({
      id: "dicht",
      openingHours: {
        source: "catalog",
        fetchedAt: null,
        periods: [{ day, openMinutes: 18 * 60, closeMinutes: 20 * 60 }],
      },
    });
    const result = recommend({
      destinations: [shut, open],
      preferences: preferences(),
      weatherById: {},
      seed: "uren",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.winner.destination.id).toBe("open");
    expect(result.winner.hoursStatus).not.toBe("unknown");
  });

  it("laat lopen vallen als de hemelsbrede afstand te groot is, zonder een reistijd te verzinnen", () => {
    const away = destination({ id: "ver", latitude: 52.2, longitude: 5.3 });
    const distance = haversineKm({ lat: 52.09083, lng: 5.12222 }, { lat: 52.2, lng: 5.3 });
    expect(distance).toBeGreaterThan(6);
    const result = recommend({
      destinations: [away],
      preferences: preferences({ transportation: "walking", maxDistanceKm: 40 }),
      weatherById: {},
      seed: "lopen",
    });
    expect(result.ok).toBe(false);
  });

  it("kiest deterministisch en documenteert de kans", () => {
    const first = destination({ id: "a", name: "A" });
    const second = destination({ id: "b", name: "B", familiarity: 5 });
    const once = recommend({
      destinations: [first, second],
      preferences: preferences(),
      weatherById: {},
      seed: "vast",
    });
    const twice = recommend({
      destinations: [first, second],
      preferences: preferences(),
      weatherById: {},
      seed: "vast",
    });
    expect(once.ok && twice.ok).toBe(true);
    if (!once.ok || !twice.ok) return;
    expect(once.winner.destination.id).toBe(twice.winner.destination.id);
    const sum = once.candidates.reduce((total, candidate) => total + candidate.probability, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(weightFromScore(1)).toBeGreaterThan(weightFromScore(0));
    const rng = mulberry32(hashSeed("vast"));
    expect(rng()).toBeCloseTo(mulberry32(hashSeed("vast"))(), 10);
    expect(weightedIndex([0, 1], () => 0.2)).toBe(1);
  });

  it("laat een herkansingsreden het gewicht verschuiven bij dezelfde seed", () => {
    const same = destination({ id: "zelfde", category: "museum" });
    const other = destination({ id: "anders", category: "park", environment: "indoor" });
    const base = {
      destinations: [same, other],
      preferences: preferences(),
      weatherById: {},
      seed: "reden-0.2",
      excludeIds: ["eerder"],
    };
    const plain = recommend(base);
    const shifted = recommend({
      ...base,
      respinReason: "not_appealing",
      previous: { category: "museum", environment: "indoor" },
    });
    expect(plain.ok && shifted.ok).toBe(true);
    if (!plain.ok || !shifted.ok) return;
    const plainSame = plain.candidates.find((candidate) => candidate.destination.id === "zelfde");
    const shiftedSame = shifted.candidates.find((candidate) => candidate.destination.id === "zelfde");
    expect(shiftedSame && plainSame && shiftedSame.weight).toBeLessThan(plainSame?.weight ?? 0);
  });

  it("zet de winnaar op het rad en laat de draaiing daar stoppen", () => {
    const result = recommend({
      destinations: [
        destination({ id: "a", name: "Alpha" }),
        destination({ id: "b", name: "Beta", category: "park" }),
      ],
      preferences: preferences(),
      weatherById: {},
      seed: "rad",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wheel.some((segment) => segment.id === result.winner.destination.id)).toBe(true);
    const segments = buildWheelSegments(
      result.candidates.map((candidate) => ({
        id: candidate.destination.id,
        label: candidate.destination.name,
        weight: candidate.weight,
      })),
      result.winner.destination.id,
    );
    const rotation = rotationForWinner(segments, result.winner.destination.id, 5);
    const winner = segments.find((segment) => segment.id === result.winner.destination.id);
    expect(winner).toBeTruthy();
    const landed = (rotation % 360 + 360) % 360;
    const mid = ((winner?.startDegrees ?? 0) + (winner?.endDegrees ?? 0)) / 2;
    expect((landed + mid) % 360).toBeCloseTo(0, 5);
  });

  it("weigert commerciële velden in de motor", () => {
    expect(() => assertNoCommercialFields({ name: "Museum", commission: 10 })).toThrow(/Commercieel veld/);
    const engineDir = path.join(process.cwd(), "src/domain/engine");
    const sources = readdirSync(engineDir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(path.join(engineDir, file), "utf8"))
      .join("\n");
    expect(sources).not.toMatch(/promotion|affiliate|commission|partnerStatus|advertising|sponsor/i);
  });
});
