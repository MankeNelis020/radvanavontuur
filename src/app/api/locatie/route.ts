import { NextResponse } from "next/server";
import { z } from "zod";
import { describePosition, resolveLocation } from "@/providers/geocoding/resolve-location";

const schema = z.union([
  z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
  }),
  z.object({ query: z.string().min(2).max(80) }),
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ summary: "Vul een plaats in of deel je locatie." }, { status: 400 });
  }
  if ("lat" in parsed.data) {
    const label = await describePosition(parsed.data.lat, parsed.data.lng);
    return NextResponse.json({ label, source: "geolocation" });
  }
  const location = await resolveLocation(parsed.data.query);
  if (!location) {
    return NextResponse.json(
      { summary: "Deze plaats is niet gevonden. Kies een plaats uit de lijst of deel je locatie." },
      { status: 404 },
    );
  }
  return NextResponse.json(location);
}
