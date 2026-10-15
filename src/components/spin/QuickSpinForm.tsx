"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { DistanceField, LocationField } from "@/components/spin/LocationField";
import { ParticipantsField, type ParticipantDraft } from "@/components/spin/ParticipantsField";
import { Button } from "@/components/ui/Button";
import { useCopy } from "@/i18n/context";
import type { Origin } from "@/domain/types";

export function QuickSpinForm() {
  const router = useRouter();
  const { t } = useCopy();
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
      setError(t.quick.locationError);
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
      setError(body.summary ?? t.quick.none);
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
      <div className="rounded-card bg-cream-100 p-4 text-sm text-ink-soft">
        <p className="font-semibold text-ink">{t.quick.defaultsTitle}</p>
        <p>{t.quick.defaults}</p>
      </div>
      <Button type="submit" className="w-full text-lg" disabled={pending}>
        {pending ? t.quick.pending : t.quick.submit}
      </Button>
      <AdSlot placement="below-form" />
    </form>
  );
}
