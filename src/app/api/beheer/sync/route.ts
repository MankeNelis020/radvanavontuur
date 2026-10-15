import { NextResponse } from "next/server";
import { syncSheets } from "@/application/sheets-sync";

export async function POST(request: Request) {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  const given = request.headers.get("x-admin-token");
  if (!expected || given !== expected) {
    return NextResponse.json({ summary: "Synchronisatie is niet geconfigureerd of de token klopt niet." }, { status: 401 });
  }
  try {
    const result = await syncSheets();
    return NextResponse.json(result);
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Synchronisatie mislukt.";
    return NextResponse.json({ summary }, { status: 503 });
  }
}
