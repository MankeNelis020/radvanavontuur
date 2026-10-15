"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlaceScene } from "@/components/brand/PlaceScene";
import { LoadingState } from "@/components/status/LoadingState";
import { MapActions } from "@/components/ui/MapActions";
import { buttonClass } from "@/components/ui/button-styles";
import { places } from "@/lib/catalog";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { readSpin } from "@/lib/session";
import type { SpinRecord } from "@/lib/types";

export function ResultsScreen({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [record, setRecord] = useState<SpinRecord | null | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecord(readSpin()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (record === undefined) return <LoadingState label={dict.status.loading} />;
  if (!record) {
    return (
      <section className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center gap-4 px-5 py-16">
        <h1 className="font-heading text-4xl font-extrabold">{dict.results.emptyTitle}</h1>
        <p className="text-lg">{dict.results.emptyBody}</p>
        <Link className={buttonClass("adventure", "w-full sm:w-auto")} href={`/${locale}/spin`}>
          {dict.spin.spin}
        </Link>
      </section>
    );
  }

  const adventure = dict.adventures[record.segment];
  const ages = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
    record.ages.map((age) => String(age)),
  );
  const noted =
    record.mode === "extended"
      ? record.preferences.length > 0
        ? fill(dict.results.noted, {
            list: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
              record.preferences.map((id) => dict.preferences[id]),
            ),
          })
        : dict.results.preferencesOpen
      : "";

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16">
      <p className="font-heading text-sm font-bold text-brand-primary">{dict.segments[record.segment]}</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold md:text-5xl">{dict.results.title}</h1>
      <p className="mt-4 max-w-2xl text-lg">{adventure.summary}</p>
      <dl className="mt-6 flex flex-col gap-2 text-brand-text">
        <div>
          <dt className="sr-only">{dict.spin.distance}</dt>
          <dd>{fill(dict.results.within, { km: record.distanceKm })}</dd>
        </div>
        <div>
          <dt className="sr-only">{dict.spin.age}</dt>
          <dd>{fill(record.ages.length > 1 ? dict.results.ageMany : dict.results.ageOne, { ages })}</dd>
        </div>
        {noted && (
          <div>
            <dt className="sr-only">{dict.spin.preferences}</dt>
            <dd>
              {noted} {dict.results.stillFree}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-8 overflow-hidden rounded-card border border-brand-line shadow-soft">
        <PlaceScene segment={record.segment} />
      </div>
      <h2 className="mt-8 font-heading text-3xl font-extrabold">{adventure.title}</h2>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link className={buttonClass("adventure", "w-full sm:w-auto")} href={`/${locale}/itinerary`}>
          {dict.results.makeToday}
        </Link>
        <MapActions dict={dict} query={places[record.segment].mapsQuery} />
      </div>
      <aside className="mt-10 rounded-card bg-brand-surface p-6">
        <h2 className="font-heading text-2xl font-extrabold">{dict.results.respinTitle}</h2>
        <p className="mt-2">{dict.results.respinBody}</p>
        <Link
          className={buttonClass("secondary", "mt-4 w-full sm:w-auto")}
          href={record.mode === "extended" ? `/${locale}/spin/extended` : `/${locale}/spin`}
        >
          {dict.results.respin}
        </Link>
      </aside>
    </article>
  );
}
