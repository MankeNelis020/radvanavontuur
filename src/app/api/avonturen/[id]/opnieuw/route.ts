import { NextResponse } from "next/server";
import { z } from "zod";
import { respinAdventure } from "@/application/adventures";
import { readOwnerToken } from "@/server/owner";

const schema = z.object({
  reason: z.enum(["been_there", "not_appealing", "not_practical", "want_different", "other"]),
  note: z.string().max(400).optional().nullable(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ summary: "Kies een reden om opnieuw te draaien." }, { status: 400 });
  const { id } = await context.params;
  try {
    const result = await respinAdventure({
      sessionId: id,
      ownerToken: owner,
      reason: parsed.data.reason,
      note: parsed.data.note ?? null,
    });
    if (!result.ok) return NextResponse.json({ summary: result.summary }, { status: 409 });
    return NextResponse.json({ id: result.session.id });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Opnieuw draaien lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
