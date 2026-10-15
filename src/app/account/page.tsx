import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/AccountPanel";
import { authConfigured } from "@/auth/config";
import { createSupabaseServerClient } from "@/auth/server";
import { getDictionary } from "@/i18n/locale";
import { getStore } from "@/persistence/get-store";
import { readOwnerToken } from "@/server/owner";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.title };
}

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { t } = await getDictionary();
  const supabase = await createSupabaseServerClient();
  let email: string | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    email = typeof data?.claims?.email === "string" ? data.claims.email : null;
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    const owner = await readOwnerToken();
    if (userId && owner) await getStore().claimOwner(owner, userId);
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl text-forest-950">{t.account.title}</h1>
      <p className="mt-2 text-ink-soft">{t.account.intro}</p>
      <div className="mt-6">
        <AccountPanel configured={authConfigured()} email={email} />
      </div>
    </div>
  );
}
