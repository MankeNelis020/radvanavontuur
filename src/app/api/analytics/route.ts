import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/persistence/get-store";

const schema = z.object({
  name: z.string().min(2).max(60),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

const ALLOWED = new Set([
  "quick_spin_started",
  "extended_spin_started",
  "spin_completed",
  "respin_requested",
  "adventure_accepted",
  "maps_opened",
  "lunch_added",
  "return_stop_added",
  "adventure_shared",
  "visit_self_confirmed",
  "review_submitted",
  "promotion_viewed",
  "promotion_clicked",
  "affiliate_clicked",
]);

export async function POST(request: Request) {
  const consent = request.headers.get("cookie") ?? "";
  if (!consent.includes("rva_consent=analytics")) {
    return NextResponse.json({ ignored: true });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !ALLOWED.has(parsed.data.name)) {
    return NextResponse.json({ summary: "Onbekend event." }, { status: 400 });
  }
  const properties = Object.fromEntries(
    Object.entries(parsed.data.properties ?? {}).filter(([key]) => !["lat", "lng", "latitude", "longitude", "origin"].includes(key)),
  );
  await getStore().addAnalytics({
    id: crypto.randomUUID(),
    name: parsed.data.name,
    createdAt: new Date().toISOString(),
    sessionId: null,
    properties,
  });
  return NextResponse.json({ ok: true });
}
