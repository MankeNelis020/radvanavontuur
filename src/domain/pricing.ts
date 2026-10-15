import type { EngineDestination, Participant } from "@/domain/types";

/**
 * Berekent de entree voor het hele gezelschap.
 * Onbekende prijzen blijven null en worden nooit als gratis gelezen.
 * Leeftijdsstaffels worden alleen gebruikt als elke deelnemer in een band valt.
 */
export function groupEntranceCostEur(
  destination: EngineDestination,
  participants: Participant[],
): number | null {
  const entrance = destination.entrance;
  if (entrance.model === "free") return 0;
  if (entrance.model === "unknown") return null;
  if (entrance.model === "per_group") return entrance.amountEur;
  if (entrance.agePrices && entrance.agePrices.length > 0) {
    let sum = 0;
    for (const participant of participants) {
      const band = entrance.agePrices.find(
        (price) =>
          participant.ageMonths >= price.minMonths && participant.ageMonths <= price.maxMonths,
      );
      if (!band) return null;
      sum += band.amountEur;
    }
    return sum;
  }
  return entrance.amountEur * participants.length;
}

export function formatEntrance(
  destination: EngineDestination,
  participants: Participant[],
): { label: string; known: boolean } {
  const cost = groupEntranceCostEur(destination, participants);
  if (destination.entrance.model === "unknown" || cost === null) {
    return {
      known: false,
      label: "Entree onbekend. Een onbekende prijs telt niet als gratis.",
    };
  }
  if (cost === 0) {
    return { known: true, label: "Gratis toegang voor het gezelschap." };
  }
  const amount = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cost);
  return { known: true, label: `Entree voor het gezelschap: ${amount}.` };
}
