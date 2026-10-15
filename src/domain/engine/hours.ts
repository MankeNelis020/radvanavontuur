import type { OpeningHours } from "@/domain/types";
import { amsterdamParts } from "@/domain/time";

export type HoursCheck = {
  status: "open" | "closed" | "unknown";
  label: string;
};

function contains(start: number, open: number, close: number): { inside: boolean; remaining: number } {
  if (close > open) {
    if (start >= open && start < close) return { inside: true, remaining: close - start };
    return { inside: false, remaining: 0 };
  }
  if (close === open) return { inside: false, remaining: 0 };
  if (start >= open) return { inside: true, remaining: 24 * 60 - start + close };
  if (start < close) return { inside: true, remaining: close - start };
  return { inside: false, remaining: 0 };
}

export function checkOpeningHours(
  hours: OpeningHours | null,
  arrival: Date,
  durationMinutes: number,
): HoursCheck {
  if (!hours || (hours.periods.length === 0 && !hours.alwaysOpen)) {
    return {
      status: "unknown",
      label: "Openingstijden zijn niet geverifieerd. We presenteren ze niet als open of gesloten.",
    };
  }
  if (hours.alwaysOpen) {
    return { status: "open", label: "Deze plek is volgens de bron 24 uur open." };
  }
  const zoned = amsterdamParts(arrival);
  const start = zoned.hour * 60 + zoned.minute;
  let bestRemaining = 0;
  let inside = false;
  for (const period of hours.periods) {
    if (period.day !== zoned.weekday) continue;
    const match = contains(start, period.openMinutes, period.closeMinutes);
    if (match.inside) {
      inside = true;
      bestRemaining = Math.max(bestRemaining, match.remaining);
    }
  }
  if (!inside) {
    return {
      status: "closed",
      label: "Volgens de bekende openingstijden is de bestemming gesloten op het gekozen tijdstip.",
    };
  }
  if (bestRemaining < durationMinutes) {
    return {
      status: "closed",
      label: "De bestemming sluit voordat het bezoek past binnen de bekende openingstijden.",
    };
  }
  const source =
    hours.source === "google_places" && hours.fetchedAt
      ? ` Bron: Google Places, opgehaald om ${hours.fetchedAt}.`
      : " Bron: eigen catalogus, niet als live gecontroleerd gemarkeerd.";
  return { status: "open", label: `Open tijdens het voorziene bezoek.${source}` };
}
