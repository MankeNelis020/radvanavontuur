import { NextResponse } from "next/server";
import { addLunch } from "@/application/adventures";
import { readOwnerToken } from "@/server/owner";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await addLunch(id, owner);
    if (!result.ok) return NextResponse.json({ summary: result.summary }, { status: 422 });
    const lunch = result.session.lunch;
    return NextResponse.json({
      ok: true,
      summary: lunch ? `Lunch: ${lunch.destination.name}. ${lunch.reason}` : "Lunch toegevoegd.",
    });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Lunch toevoegen lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
