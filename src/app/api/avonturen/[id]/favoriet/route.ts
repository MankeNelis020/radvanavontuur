import { NextResponse } from "next/server";
import { z } from "zod";
import { setFavorite } from "@/application/adventures";
import { currentUserId } from "@/auth/server";
import { readOwnerToken } from "@/server/owner";

const schema = z.object({ favorite: z.boolean() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ summary: "Onbekende keuze." }, { status: 400 });
  const { id } = await context.params;
  try {
    await setFavorite(id, owner, await currentUserId(), parsed.data.favorite);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Bewaren lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
