import { z } from "zod";

const destinationRow = z.object({
  destination_id: z.string().min(2),
  provider_place_id: z.string().optional().default(""),
  name: z.string().min(2),
  category: z.string().min(2),
  latitude: z.coerce.number().gte(50).lte(54),
  longitude: z.coerce.number().gte(3).lte(8),
  minimum_age: z.coerce.number().int().nonnegative().optional(),
  maximum_age: z.coerce.number().int().positive().optional(),
  accessibility: z.string().optional().default(""),
  activity_level: z.coerce.number().int().min(1).max(5),
  indoor_outdoor: z.enum(["indoor", "outdoor", "both"]),
  estimated_duration: z.coerce.number().int().positive(),
  entrance_price: z.string().optional().default(""),
  source_url: z.string().url().optional().or(z.literal("")).default(""),
  verification_status: z.string().optional().default("editorial"),
  last_verified_at: z.string().optional().default(""),
});

const partnerRow = z.object({
  partner_id: z.string().min(2),
  destination_id: z.string().min(2),
  organization_name: z.string().min(2),
  contact_name: z.string().optional().default(""),
  contact_email: z.string().email().or(z.literal("")).default(""),
  agreement_status: z.enum(["concept", "active", "ended"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

const promotionRow = z.object({
  promotion_id: z.string().min(2),
  destination_id: z.string().min(2),
  promotion_title: z.string().min(2),
  promotion_description: z.string().optional().default(""),
  discount_type: z.enum(["percentage", "fixed", "perk"]),
  discount_value: z.string().optional().default(""),
  promotion_code: z.string().optional().default(""),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  terms: z.string().optional().default(""),
  active: z.enum(["true", "false", "ja", "nee", "1", "0"]),
  redemption_url: z.string().url().or(z.literal("")).default(""),
});

const qualityRow = z.object({
  destination_id: z.string().min(2),
  field_name: z.string().min(1),
  source: z.string().min(1),
  last_checked_at: z.string().optional().default(""),
  confidence: z.enum(["low", "medium", "high"]).optional().default("low"),
  issue: z.string().optional().default(""),
  review_status: z.enum(["open", "resolved", "ignored"]).optional().default("open"),
});

export type SheetTables = {
  destinations: Record<string, string>[];
  partners: Record<string, string>[];
  promotions: Record<string, string>[];
  quality: Record<string, string>[];
};

export type SyncIssue = { sheet: string; row: number; message: string };

function rowsFromMatrix(matrix: string[][]): Record<string, string>[] {
  const [header, ...rest] = matrix;
  if (!header) return [];
  return rest
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) =>
      Object.fromEntries(header.map((key, index) => [key.trim(), (row[index] ?? "").trim()])),
    );
}

export function parseSheetMatrices(input: {
  destinations: string[][];
  partners: string[][];
  promotions: string[][];
  quality: string[][];
}): { tables: SheetTables; issues: SyncIssue[] } {
  const issues: SyncIssue[] = [];
  const tables: SheetTables = {
    destinations: [],
    partners: [],
    promotions: [],
    quality: [],
  };
  const seen = new Set<string>();
  rowsFromMatrix(input.destinations).forEach((row, index) => {
    const parsed = destinationRow.safeParse(row);
    if (!parsed.success) {
      issues.push({ sheet: "Destinations", row: index + 2, message: "Rij is ongeldig en overgeslagen." });
      return;
    }
    if (seen.has(parsed.data.destination_id)) {
      issues.push({
        sheet: "Destinations",
        row: index + 2,
        message: `Dubbele destination_id ${parsed.data.destination_id} overgeslagen.`,
      });
      return;
    }
    seen.add(parsed.data.destination_id);
    tables.destinations.push(row);
  });
  rowsFromMatrix(input.partners).forEach((row, index) => {
    const parsed = partnerRow.safeParse(row);
    if (!parsed.success) {
      issues.push({ sheet: "Partners", row: index + 2, message: "Rij is ongeldig en overgeslagen." });
      return;
    }
    tables.partners.push(row);
  });
  rowsFromMatrix(input.promotions).forEach((row, index) => {
    const parsed = promotionRow.safeParse(row);
    if (!parsed.success) {
      issues.push({ sheet: "Promotions", row: index + 2, message: "Rij is ongeldig en overgeslagen." });
      return;
    }
    tables.promotions.push(row);
  });
  rowsFromMatrix(input.quality).forEach((row, index) => {
    const parsed = qualityRow.safeParse(row);
    if (!parsed.success) {
      issues.push({ sheet: "Data Quality", row: index + 2, message: "Rij is ongeldig en overgeslagen." });
      return;
    }
    tables.quality.push(row);
  });
  return { tables, issues };
}

export function destinationFromSheet(row: Record<string, string>) {
  const parsed = destinationRow.parse(row);
  const access = parsed.accessibility
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const price = parsed.entrance_price.trim();
  return {
    id: parsed.destination_id,
    providerPlaceId: parsed.provider_place_id || null,
    name: parsed.name,
    category: parsed.category,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    minimumAgeMonths: parsed.minimum_age !== undefined ? parsed.minimum_age * 12 : 0,
    maximumAgeMonths: parsed.maximum_age !== undefined ? parsed.maximum_age * 12 : null,
    accessibility: access,
    activityLevel: parsed.activity_level,
    environment: parsed.indoor_outdoor,
    estimatedDurationMinutes: parsed.estimated_duration,
    entrancePrice: price,
    sourceUrl: parsed.source_url || null,
    verificationStatus: parsed.verification_status,
    lastVerifiedAt: parsed.last_verified_at || null,
  };
}

export { destinationRow, partnerRow, promotionRow, qualityRow };
