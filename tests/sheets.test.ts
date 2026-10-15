import { describe, expect, it } from "vitest";
import { parseSheetMatrices } from "@/providers/sheets/sync";

describe("spreadsheetimport", () => {
  it("slaat kapotte rijen over en weigert een dubbele bestemming", () => {
    const parsed = parseSheetMatrices({
      destinations: [
        ["destination_id", "name", "category", "latitude", "longitude", "activity_level", "indoor_outdoor", "estimated_duration"],
        ["dom", "Domtoren", "monument", "52.09", "5.12", "3", "both", "60"],
        ["dom", "Nog een", "monument", "52.09", "5.12", "3", "both", "60"],
        ["kapot", "", "monument", "geen-breedte", "5", "3", "both", "60"],
      ],
      partners: [["partner_id", "destination_id", "organization_name", "agreement_status", "start_date"], ["pa", "dom", "Stichting", "active", "2026-01-01"]],
      promotions: [["promotion_id"]],
      quality: [["destination_id", "field_name", "source"], ["dom", "entrance_price", "sheet"]],
    });
    expect(parsed.tables.destinations).toHaveLength(1);
    expect(parsed.issues.some((issue) => issue.message.includes("Dubbele"))).toBe(true);
    expect(parsed.issues.some((issue) => issue.message.includes("ongeldig"))).toBe(true);
    expect(parsed.tables.partners).toHaveLength(1);
  });
});
