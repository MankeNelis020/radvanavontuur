import { NextResponse } from "next/server";
import { createAdventure } from "@/application/adventures";
import { currentUserId } from "@/auth/server";
import { resolvePreferences, spinRequestSchema } from "@/domain/preferences";
import { getStore } from "@/persistence/get-store";
import { ownerToken } from "@/server/owner";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = spinRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ summary: "De invoer klopt niet. Controleer leeftijden, afstand en locatie." }, { status: 400 });
  }
  const userId = await currentUserId();
  const visited = userId && parsed.data.avoidVisited ? await getStore().listVisited(userId) : [];
  const preferences = resolvePreferences(
    { ...parsed.data, visitedDestinationIds: visited },
    new Date(),
  );
  try {
    const result = await createAdventure({
      preferences,
      ownerToken: await ownerToken(),
      userId,
      visitedIds: visited,
    });
    if (!result.ok) return NextResponse.json({ summary: result.summary, rejected: result.rejected }, { status: 422 });
    return NextResponse.json({ id: result.session.id });
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Het avontuur kon niet worden bewaard.";
    return NextResponse.json({ summary }, { status: 500 });
  }
}
