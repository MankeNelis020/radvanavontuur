"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/auth/browser";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/choice";
import { useCopy } from "@/i18n/context";
import { fill } from "@/i18n/dictionary";

export function AccountPanel({ configured, email }: { configured: boolean; email: string | null }) {
  const router = useRouter();
  const { t } = useCopy();
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!configured) {
    return <p className="rounded-card bg-cream-100 p-4">{t.account.unconfigured}</p>;
  }

  if (email) {
    return (
      <div className="space-y-3">
        <p>{fill(t.account.signedIn, { email })}</p>
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
          {t.account.signOut}
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
        setMessage(error ? t.account.failed : t.account.sent);
      }}
    >
      <label className="block font-semibold" htmlFor="email">
        {t.account.email}
        <input id="email" type="email" required value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} />
      </label>
      <Button type="submit">{t.account.send}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
