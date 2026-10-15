import type { CatalogDestination } from "@/data/catalog";
import type { PartnerRecord, PromotionRecord } from "@/domain/promotions/types";
import { getStore } from "@/persistence/get-store";
import { readWorksheets, sheetsConfigured } from "@/providers/sheets/google-sheets";
import { destinationFromSheet, parseSheetMatrices, partnerRow, promotionRow, qualityRow } from "@/providers/sheets/sync";

export async function syncSheets(): Promise<{ imported: number; issues: { sheet: string; row: number; message: string }[] }> {
  if (!sheetsConfigured()) {
    throw new Error("Google Sheets is niet geconfigureerd.");
  }
  const matrices = await readWorksheets();
  if (!matrices) throw new Error("Google Sheets is niet geconfigureerd.");
  const { tables, issues } = parseSheetMatrices(matrices);
  const store = getStore();
  for (const row of tables.destinations) {
    const parsed = destinationFromSheet(row);
    const destination: CatalogDestination = {
      id: parsed.id,
      name: parsed.name,
      category: parsed.category,
      interests: [],
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      address: parsed.name,
      locality: "",
      description: "Geïmporteerd uit het beheersheet. Openingstijden en prijs blijven leeg tenzij het veld een betrouwbare waarde had.",
      minimumAgeMonths: parsed.minimumAgeMonths,
      maximumAgeMonths: parsed.maximumAgeMonths,
      ageSuitabilityKnown: true,
      ageSuitabilityNote: "Leeftijd komt uit het beheersheet en is niet live geverifieerd.",
      accessibility: {
        wheelchair: parsed.accessibility.includes("wheelchair") ? true : null,
        buggy: parsed.accessibility.includes("buggy") ? true : null,
        stroller: parsed.accessibility.includes("stroller") ? true : null,
        limitedWalking: parsed.accessibility.includes("limitedWalking") ? true : null,
        stairsFree: parsed.accessibility.includes("stairsFree") ? true : null,
      },
      activityLevel: parsed.activityLevel as 1 | 2 | 3 | 4 | 5,
      relaxationAdventure: 3,
      environment: parsed.environment,
      familiarity: 3,
      estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      entrance:
        parsed.entrancePrice === ""
          ? { model: "unknown", note: "Geen prijs in het sheet." }
          : parsed.entrancePrice === "0"
            ? { model: "free", note: "In het sheet als gratis gemarkeerd." }
            : { model: "per_group", amountEur: Number(parsed.entrancePrice), note: "Prijs uit het beheersheet, niet live gecontroleerd." },
      openingHours: null,
      providerPlaceId: parsed.providerPlaceId,
      website: null,
      imageUrl: null,
      sourceUrl: parsed.sourceUrl,
      coordinateSource: "Google Sheet",
      verificationStatus: "editorial",
      safetyRestrictions: [],
      roles: ["adventure"],
      osmRef: "sheet",
    };
    if (destination.entrance.model === "per_group" && !Number.isFinite(destination.entrance.amountEur)) {
      issues.push({ sheet: "Destinations", row: 0, message: `${parsed.id}: prijs is geen getal en telt als onbekend.` });
      destination.entrance = { model: "unknown", note: "Ongeldige prijs in het sheet." };
    }
    await store.saveOverride(destination);
  }
  for (const row of tables.partners) {
    const parsed = partnerRow.parse(row);
    const partner: PartnerRecord = {
      id: parsed.partner_id,
      destinationId: parsed.destination_id,
      organizationName: parsed.organization_name,
      contactName: parsed.contact_name,
      contactEmail: parsed.contact_email,
      agreementStatus: parsed.agreement_status,
      startDate: parsed.start_date,
      endDate: parsed.end_date || null,
      notes: parsed.notes,
    };
    await store.savePartner(partner);
  }
  for (const row of tables.promotions) {
    const parsed = promotionRow.parse(row);
    const promotion: PromotionRecord = {
      id: parsed.promotion_id,
      destinationId: parsed.destination_id,
      title: parsed.promotion_title,
      description: parsed.promotion_description,
      discountType: parsed.discount_type,
      discountValue: parsed.discount_value ? Number(parsed.discount_value) : null,
      code: parsed.promotion_code || null,
      startDate: parsed.start_date,
      endDate: parsed.end_date,
      terms: parsed.terms,
      active: parsed.active === "true" || parsed.active === "ja" || parsed.active === "1",
      redemptionUrl: parsed.redemption_url || null,
    };
    await store.savePromotion(promotion);
  }
  await store.saveQuality(
    tables.quality.map((row) => {
      const parsed = qualityRow.parse(row);
      return {
        destinationId: parsed.destination_id,
        fieldName: parsed.field_name,
        source: parsed.source,
        lastCheckedAt: parsed.last_checked_at,
        confidence: parsed.confidence,
        issue: parsed.issue,
        reviewStatus: parsed.review_status,
      };
    }),
  );
  return { imported: tables.destinations.length + tables.partners.length + tables.promotions.length, issues };
}
