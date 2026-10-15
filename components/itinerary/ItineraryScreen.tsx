"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/status/LoadingState";
import { MapActions } from "@/components/ui/MapActions";
import { buttonClass } from "@/components/ui/button-styles";
import { places } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { readSpin } from "@/lib/session";
import type { SpinRecord } from "@/lib/types";

export function ItineraryScreen({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [record, setRecord] = useState<SpinRecord | null | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecord(readSpin()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (record === undefined) return <LoadingState label={dict.status.loading} />;
  if (!record) {
    return (
      <section className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center gap-4 px-5 py-16">
        <h1 className="font-heading text-4xl font-extrabold">{dict.itinerary.emptyTitle}</h1>
        <p className="text-lg">{dict.itinerary.emptyBody}</p>
        <Link className={buttonClass("adventure", "w-full sm:w-auto")} href={`/${locale}/spin`}>
          {dict.spin.spin}
        </Link>
      </section>
    );
  }

  const adventure = dict.adventures[record.segment];
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16">
      <p className="font-heading text-sm font-bold text-brand-primary">{dict.segments[record.segment]}</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold md:text-5xl">{adventure.title}</h1>
      <p className="mt-4 max-w-2xl text-lg">{adventure.summary}</p>
      <ol className="mt-10 space-y-8 border-s-2 border-brand-sage ps-6">
        {adventure.steps.map((step) => (
          <li key={step.title} className="relative">
            <span className="absolute -start-[1.95rem] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-background bg-brand-primary" />
            <h2 className="font-heading text-2xl font-extrabold">{step.title}</h2>
            <p className="mt-1 text-brand-text">{step.detail}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <MapActions dict={dict} query={places[record.segment].mapsQuery} />
        <Link className={buttonClass("secondary", "w-full sm:w-auto")} href={`/${locale}/results`}>
          {dict.itinerary.back}
        </Link>
      </div>
    </article>
  );
}
