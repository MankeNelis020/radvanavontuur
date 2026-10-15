"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { DistanceField, LocationField } from "@/components/spin/LocationField";
import { ParticipantsField, type ParticipantDraft } from "@/components/spin/ParticipantsField";
import { Button } from "@/components/ui/Button";
import type { Origin } from "@/domain/types";

export function QuickSpinForm() {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantDraft[]>([
    { id: "een", ageMonths: 34 * 12 },
    { id: "twee", ageMonths: 6 * 12 },
  ]);
  const [distance, setDistance] = useState(30);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resolveOrigin(): Promise<Origin | null> {
    if (origin) return origin;
    const response = await fetch("/api/locatie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) return null;
    return (await response.json()) as Origin;
  }

  async function submit() {
    setPending(true);
    setError(null);
    const resolved = await resolveOrigin();
    if (!resolved) {
      setError("Kies je locatie of een plaats die we herkennen.");
      setPending(false);
      return;
    }
    const response = await fetch("/api/avonturen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        participants,
        origin: resolved,
        maxDistanceKm: distance,
      }),
    });
    const body = (await response.json()) as { id?: string; summary?: string };
    if (!response.ok || !body.id) {
      setError(body.summary ?? "Er is geen avontuur gevonden binnen deze grenzen.");
      setPending(false);
      return;
    }
    router.push(`/avontuur/${body.id}`);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <ParticipantsField participants={participants} onChange={setParticipants} />
      <DistanceField value={distance} onChange={setDistance} />
      <LocationField origin={origin} query={query} onQuery={setQuery} onOrigin={setOrigin} error={error} />
      <div className="rounded-3xl bg-white/70 p-4 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Standaard voor de snelle draai</p>
        <p>Binnen en buiten, gebalanceerd tempo, geen budgetmaximum, betaald mag, vertrek zo snel mogelijk, halve dag. Geen vervoermiddel, dus geen verzonnen reistijd.</p>
      </div>
      <Button type="submit" className="w-full text-lg" disabled={pending}>
        {pending ? "Bestemmingen controleren…" : "Naar het rad"}
      </Button>
      <AdSlot placement="below-form" />
    </form>
  );
}
