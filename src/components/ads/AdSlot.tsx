"use client";

import { fill } from "@/i18n/dictionary";
import { useCopy } from "@/i18n/context";

type Placement = "below-form" | "below-result" | "itinerary";

export function AdSlot({ placement }: { placement: Placement }) {
  const { t } = useCopy();
  return (
    <aside aria-label={t.ads.label} data-placement={placement} className="rounded-card border border-dashed border-forest-700/30 bg-cream-50 px-4 py-3 text-sm text-ink-soft">
      <p className="font-semibold text-ink">{t.ads.title}</p>
      <p>{fill(t.ads.body, { place: t.ads[placement] })}</p>
    </aside>
  );
}
