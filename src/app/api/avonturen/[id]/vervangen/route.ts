import { NextResponse } from "next/server";
import { replaceAdventure } from "@/application/adventures";
import { readOwnerToken } from "@/server/owner";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await replaceAdventure({ sessionId: id, ownerToken: owner });
    if (!result.ok) return NextResponse.json({ summary: result.summary }, { status: 422 });
    return NextResponse.json({ id: result.session.id });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Vervangen lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
