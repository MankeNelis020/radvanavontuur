"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { useCopy } from "@/i18n/context";

function subscribe() {
  return () => undefined;
}

function needsChoice() {
  return !window.localStorage.getItem("rva-consent");
}

export function ConsentBar() {
  const { t } = useCopy();
  const open = useSyncExternalStore(subscribe, needsChoice, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!open || dismissed) return null;

  function choose(value: "denied" | "analytics") {
    window.localStorage.setItem("rva-consent", value);
    document.cookie = `rva_consent=${value}; path=/; max-age=15552000; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-card border border-cream-200 bg-forest-950 p-4 text-cream-50 shadow-soft sm:inset-x-auto sm:right-4 sm:max-w-md">
      <p className="font-display text-xl">{t.consent.title}</p>
      <p className="mt-2 text-sm text-cream-100">{t.consent.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="quiet" onClick={() => choose("analytics")}>
          {t.consent.allow}
        </Button>
        <button
          type="button"
          className="touch-target inline-flex items-center justify-center rounded-full border border-cream-100 px-5 py-3 font-display font-semibold text-cream-50"
          onClick={() => choose("denied")}
        >
          {t.consent.deny}
        </button>
      </div>
    </div>
  );
}
