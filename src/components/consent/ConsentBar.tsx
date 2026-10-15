"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";

function subscribe() {
  return () => undefined;
}

function needsChoice() {
  return !window.localStorage.getItem("rva-consent");
}

export function ConsentBar() {
  const open = useSyncExternalStore(subscribe, needsChoice, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!open || dismissed) return null;

  function choose(value: "denied" | "analytics") {
    window.localStorage.setItem("rva-consent", value);
    document.cookie = `rva_consent=${value}; path=/; max-age=15552000; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-cream-200 bg-forest-950 p-4 text-cream-50 shadow-2xl sm:inset-x-auto sm:right-4 sm:max-w-md">
      <p className="font-display text-xl">Alleen wat nodig is</p>
      <p className="mt-2 text-sm text-cream-100">
        Het rad werkt zonder account en zonder meetcookies. Analytics bewaren we pas na je keuze, zonder je precieze locatie.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="gold" onClick={() => choose("analytics")}>
          Analytics toestaan
        </Button>
        <Button variant="quiet" onClick={() => choose("denied")}>
          Alleen noodzakelijk
        </Button>
      </div>
    </div>
  );
}
