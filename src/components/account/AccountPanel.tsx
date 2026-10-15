"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/auth/browser";
import { Button } from "@/components/ui/Button";

export function AccountPanel({ configured, email }: { configured: boolean; email: string | null }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!configured) {
    return (
      <p className="rounded-3xl bg-cream-100 p-4">
        Accounts zijn nog niet aangesloten. Zet Supabase-variabelen in de omgeving. Tot die tijd werkt het rad gewoon zonder account.
      </p>
    );
  }

  if (email) {
    return (
      <div className="space-y-3">
        <p>Je bent ingelogd als {email}. Avonturen uit deze browser zijn aan dit account gekoppeld als ze nog van niemand waren.</p>
        <Button
          type="button"
          variant="quiet"
          onClick={async () => {
            const client = createSupabaseBrowserClient();
            await client?.auth.signOut();
            router.push("/account");
            router.refresh();
          }}
        >
          Uitloggen
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const client = createSupabaseBrowserClient();
        if (!client) return;
        const { error } = await client.auth.signInWithOtp({
          email: address,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        setMessage(error ? "De inlogmail kon niet worden verstuurd." : "Kijk in je inbox voor de inloglink.");
      }}
    >
      <label className="block font-semibold" htmlFor="email">
        E-mailadres
        <input id="email" type="email" required value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full rounded-2xl border border-cream-200 p-3 font-normal" />
      </label>
      <Button type="submit">Stuur een inloglink</Button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
