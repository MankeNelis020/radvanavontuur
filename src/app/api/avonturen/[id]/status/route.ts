import { NextResponse } from "next/server";
import { z } from "zod";
import { mapsUrlFor, updateStatus } from "@/application/adventures";
import { currentUserId } from "@/auth/server";
import { readOwnerToken } from "@/server/owner";

const schema = z.object({
  status: z.enum(["accepted", "route_opened", "visit_self_confirmed", "not_visited"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ summary: "Onbekende status." }, { status: 400 });
  const { id } = await context.params;
  try {
    const session = await updateStatus({
      sessionId: id,
      ownerToken: owner,
      status: parsed.data.status,
      userId: await currentUserId(),
    });
    return NextResponse.json({ ok: true, mapsUrl: mapsUrlFor(session, true) });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Status bijwerken lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
