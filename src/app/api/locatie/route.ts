import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveLocation } from "@/providers/geocoding/resolve-location";

const schema = z.object({ query: z.string().min(2).max(80) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ summary: "Vul een plaats of postcode in." }, { status: 400 });
  }
  const location = await resolveLocation(parsed.data.query);
  if (!location) {
    return NextResponse.json(
      { summary: "Deze plaats is niet gevonden. Kies een plaats uit de lijst of sta locatie toe." },
      { status: 404 },
    );
  }
  return NextResponse.json(location);
}
