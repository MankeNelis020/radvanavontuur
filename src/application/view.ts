import { activeSelection, affiliateFor, mapsUrlFor, promotionFor } from "@/application/adventures";
import { formatKm } from "@/domain/geo";
import { formatEntrance } from "@/domain/pricing";
import type { StoredSession } from "@/persistence/types";
import type { PromotionView } from "@/domain/promotions/types";
import type { AffiliateOffer } from "@/domain/promotions/types";

export type AdventureView = {
  id: string;
  sharePath: string;
  mode: StoredSession["preferences"]["mode"];
  status: StoredSession["status"];
  respinUsed: boolean;
  canRespin: boolean;
  participantCount: number;
  ages: number[] | null;
  summary: string[];
  specificNeeds: string | null;
  favorite: boolean;
  completion: StoredSession["preferences"]["completion"];
  selection: {
    name: string;
    category: string;
    description: string;
    address: string;
    locality: string;
    explanation: string[];
    ageNote: string;
    weatherSummary: string;
    weatherStatus: string;
    temperatureC: number | null;
    hoursLabel: string;
    hoursStatus: string;
    distanceLabel: string;
    travelLabel: string;
    entranceLabel: string;
    accessibilityLabel: string;
    probabilityLabel: string;
    wheel: StoredSession["selections"][number]["wheel"];
    winnerId: string;
  } | null;
  lunch: { name: string; address: string; reason: string } | null;
  returnStop: { name: string; address: string; reason: string } | null;
  mapsUrl: string | null;
  promotion: PromotionView | null;
  affiliate: AffiliateOffer | null;
  sources: StoredSession["sources"];
  shared: boolean;
};

function accessibilityLabel(session: StoredSession): string {
  const current = activeSelection(session);
  if (!current) return "Geen toegankelijkheidsgegevens.";
  const access = current.destination.accessibility;
  const known = Object.entries(access).filter(([, value]) => value !== null);
  if (known.length === 0) {
    return "Toegankelijkheid is niet vastgelegd. Dat betekent niet dat de plek ontoegankelijk of toegankelijk is.";
  }
  const labels: Record<string, string> = {
    wheelchair: "rolstoel",
    buggy: "buggy",
    stroller: "kinderwagen",
    limitedWalking: "korte loopafstand",
    stairsFree: "geen trappen",
  };
  return known
    .map(([key, value]) => `${labels[key] ?? key}: ${value ? "bevestigd" : "niet geschikt volgens de bron"}`)
    .join(". ");
}

export async function toAdventureView(session: StoredSession, shared: boolean): Promise<AdventureView> {
  const current = activeSelection(session);
  const preferences = session.preferences;
  const promotion = shared ? null : await promotionFor(session);
  const affiliate = shared ? null : await affiliateFor(session);
  return {
    id: session.id,
    sharePath: `/delen/${session.shareToken}`,
    mode: preferences.mode,
    status: session.status,
    respinUsed: session.respinUsed,
    canRespin: !session.respinUsed && !shared,
    participantCount: preferences.participants.length,
    ages: shared ? null : preferences.participants.map((person) => person.ageMonths),
    summary: preferences.defaultsApplied,
    specificNeeds: shared ? null : preferences.specificNeeds,
    favorite: session.favorite,
    completion: preferences.completion,
    selection: current
      ? {
          name: current.destination.name,
          category: current.destination.category,
          description: current.destination.description,
          address: current.destination.address,
          locality: current.destination.locality,
          explanation: current.explanation,
          ageNote: current.destination.ageSuitabilityNote,
          weatherSummary: current.weather?.summaryNl ?? "Weerinformatie ontbreekt.",
          weatherStatus: current.weather?.status ?? "unavailable",
          temperatureC: current.weather?.temperatureC ?? null,
          hoursLabel: current.hoursLabel,
          hoursStatus: current.hoursStatus,
          distanceLabel: `Hemelsbreed ${formatKm(current.distanceKm)}.`,
          travelLabel:
            current.travel === null
              ? "Reistijd niet beschikbaar."
              : `Reistijd ongeveer ${current.travel.durationMinutes} minuten, enkele reis, via Google Routes (${current.travel.fetchedAt}).`,
          entranceLabel: formatEntrance(current.destination, preferences.participants).label,
          accessibilityLabel: accessibilityLabel(session),
          probabilityLabel: `Ongeveer ${Math.round(current.probability * 100)}% binnen de beoordeelde kandidaten.`,
          wheel: current.wheel,
          winnerId: current.destination.id,
        }
      : null,
    lunch: session.lunch
      ? {
          name: session.lunch.destination.name,
          address: session.lunch.destination.address,
          reason: session.lunch.reason,
        }
      : null,
    returnStop: session.returnStop
      ? {
          name: session.returnStop.destination.name,
          address: session.returnStop.destination.address,
          reason: session.returnStop.reason,
        }
      : null,
    mapsUrl: mapsUrlFor(session, !shared),
    promotion,
    affiliate,
    sources: session.sources,
    shared,
  };
}
