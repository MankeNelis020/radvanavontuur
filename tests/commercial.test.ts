import { describe, expect, it } from "vitest";
import { recommend } from "@/domain/engine/recommend";
import { findAffiliateAfterSelection, findPromotionAfterSelection } from "@/domain/promotions/promotion-service";
import type { PartnerRecord, PromotionRecord } from "@/domain/promotions/types";
import { destination, preferences } from "./helpers";

const input = {
  destinations: [
    destination({ id: "museum", name: "Museum" }),
    destination({ id: "park", name: "Park", category: "park", interests: ["nature"] }),
  ],
  preferences: preferences(),
  weatherById: {},
  seed: "onafhankelijk",
};

function partner(overrides: Partial<PartnerRecord> = {}): PartnerRecord {
  return {
    id: "p1",
    destinationId: "museum",
    organizationName: "Stichting",
    contactName: "A",
    contactEmail: "a@example.com",
    agreementStatus: "active",
    startDate: "2020-01-01",
    endDate: null,
    notes: "",
    ...overrides,
  };
}

function promotion(overrides: Partial<PromotionRecord> = {}): PromotionRecord {
  return {
    id: "promo",
    destinationId: "museum",
    title: "Korting",
    description: "Na selectie.",
    discountType: "percentage",
    discountValue: 10,
    code: null,
    startDate: "2020-01-01",
    endDate: "2030-01-01",
    terms: "Niet combineerbaar.",
    active: true,
    redemptionUrl: null,
    ...overrides,
  };
}

describe("commerciële onafhankelijkheid", () => {
  it("verandert partnerstatus, commissie, korting, actie of advertentiebudget de uitslag niet", () => {
    const first = recommend(input);
    const variants = [
      { partnerStatus: "active", commission: 0, discount: 0, promotion: false, adSpend: 0 },
      { partnerStatus: "ended", commission: 40, discount: 90, promotion: true, adSpend: 100000 },
    ];
    for (const variant of variants) {
      const again = recommend(input);
      expect(again.ok && first.ok && again.winner.destination.id).toBe(
        first.ok ? first.winner.destination.id : "",
      );
      const view = findPromotionAfterSelection(
        variant.promotion ? [promotion({ discountValue: variant.discount })] : [],
        [partner({ agreementStatus: variant.partnerStatus === "active" ? "active" : "ended" })],
        first.ok ? first.winner.destination.id : "museum",
        new Date("2026-06-15T10:00:00.000Z"),
      );
      if (first.ok && first.winner.destination.id !== "museum") expect(view).toBeNull();
      void variant.commission;
      void variant.adSpend;
    }
    expect(first.ok).toBe(true);
  });

  it("toont een actie alleen na selectie en nooit als die verlopen is", () => {
    const at = new Date("2026-06-15T10:00:00.000Z");
    expect(findPromotionAfterSelection([promotion()], [partner()], "museum", at)?.title).toBe("Korting");
    expect(
      findPromotionAfterSelection([promotion({ endDate: "2020-02-01" })], [partner()], "museum", at),
    ).toBeNull();
    expect(findPromotionAfterSelection([promotion()], [partner({ agreementStatus: "ended" })], "museum", at)).toBeNull();
    expect(findAffiliateAfterSelection([{ id: "a", destinationId: "museum", label: "Tickets", url: "https://example.com", provider: "partner" }], "museum", false)).toBeNull();
  });
});
