import { NextResponse } from "next/server";
import { addReturnStop } from "@/application/adventures";
import { readOwnerToken } from "@/server/owner";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await readOwnerToken();
  if (!owner) return NextResponse.json({ summary: "Geen sessie in deze browser." }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await addReturnStop(id, owner);
    if (!result.ok) return NextResponse.json({ summary: result.summary }, { status: 422 });
    const stop = result.session.returnStop;
    return NextResponse.json({
      ok: true,
      summary: stop ? `Tussenstop: ${stop.destination.name}. ${stop.reason}` : "Tussenstop toegevoegd.",
    });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Tussenstop toevoegen lukte niet.";
    return NextResponse.json({ summary }, { status: 404 });
  }
}
