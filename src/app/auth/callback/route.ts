import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/auth/server";
import { getStore } from "@/persistence/get-store";
import { readOwnerToken } from "@/server/owner";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createSupabaseServerClient();
  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    const owner = await readOwnerToken();
    if (userId && owner) await getStore().claimOwner(owner, userId);
  }
  return NextResponse.redirect(new URL("/account", url.origin));
}
