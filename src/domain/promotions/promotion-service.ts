import type { AffiliateOffer, PartnerRecord, PromotionRecord, PromotionView } from "@/domain/promotions/types";

function within(day: string, start: string, end: string | null, at: Date): boolean {
  const current = at.toISOString().slice(0, 10);
  if (current < start) return false;
  if (end && current > end) return false;
  return true;
}

/**
 * Alleen aanroepen nadat de aanbevelingsmotor een bestemming heeft gekozen.
 * Deze module importeert de motor niet en geeft de motor geen partnerdata.
 */
export function findPromotionAfterSelection(
  promotions: PromotionRecord[],
  partners: PartnerRecord[],
  destinationId: string,
  at: Date,
): PromotionView | null {
  const partner = partners.find(
    (item) =>
      item.destinationId === destinationId &&
      item.agreementStatus === "active" &&
      within(item.startDate, item.startDate, item.endDate, at),
  );
  if (!partner) return null;
  const promotion = promotions.find(
    (item) =>
      item.destinationId === destinationId &&
      item.active &&
      within(item.startDate, item.startDate, item.endDate, at),
  );
  if (!promotion) return null;
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description,
    terms: promotion.terms,
    validUntil: promotion.endDate,
    code: promotion.code,
    redemptionUrl: promotion.redemptionUrl,
  };
}

export function findAffiliateAfterSelection(
  offers: AffiliateOffer[],
  destinationId: string,
  enabled: boolean,
): AffiliateOffer | null {
  if (!enabled) return null;
  return offers.find((offer) => offer.destinationId === destinationId) ?? null;
}
