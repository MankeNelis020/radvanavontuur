import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceScene } from "@/components/brand/PlaceScene";
import { WheelGraphic } from "@/components/wheel/WheelGraphic";
import { buttonClass } from "@/components/ui/button-styles";
import { MapActions } from "@/components/ui/MapActions";
import { places } from "@/lib/catalog";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";
import type { SegmentId } from "@/lib/types";

const featured: SegmentId[] = ["forest", "coast", "city"];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-20">
        <div>
          <p className="mb-4 inline-flex min-h-8 items-center rounded-button bg-brand-highlight px-3 font-heading text-sm font-bold text-brand-primary">
            {dict.home.eyebrow}
          </p>
          <h1 className="max-w-[12ch] font-heading text-5xl font-extrabold leading-none md:text-7xl">{dict.home.title}</h1>
          <p className="mt-5 max-w-[36ch] text-lg">{dict.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={buttonClass("adventure", "w-full sm:w-auto")} href={`/${locale}/spin`}>
              {dict.home.primaryCta}
            </Link>
            <Link className={buttonClass("secondary", "w-full sm:w-auto")} href={`/${locale}/spin/extended`}>
              {dict.home.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="rounded-card bg-brand-surface p-4 shadow-soft md:p-6">
          <WheelGraphic labels={dict.segments} label={dict.wheelLabel} />
          <p className="mt-2 text-center text-sm text-brand-text-muted">{dict.home.wheelCaption}</p>
        </div>
      </section>

      <section className="bg-brand-surface py-14 md:py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="font-heading text-3xl font-extrabold md:text-4xl">{dict.home.stepsTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {dict.home.steps.map((step, index) => (
              <li key={step.title} className="rounded-card border-t-4 border-brand-terracotta bg-brand-background p-6 shadow-soft">
                <p className="font-heading text-sm font-bold text-brand-primary">{index + 1}</p>
                <h3 className="mt-2 font-heading text-2xl font-extrabold">{step.title}</h3>
                <p className="mt-2 text-brand-text">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-16">
        <h2 className="font-heading text-3xl font-extrabold md:text-4xl">{dict.home.featuredTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featured.map((segment) => (
            <article key={segment} className="overflow-hidden rounded-card border border-brand-line bg-brand-background shadow-soft">
              <PlaceScene segment={segment} />
              <div className="space-y-3 p-5">
                <p className="font-heading text-sm font-bold text-brand-primary">{dict.segments[segment]}</p>
                <h3 className="font-heading text-2xl font-extrabold">{dict.adventures[segment].title}</h3>
                <p>{dict.adventures[segment].summary}</p>
                <MapActions dict={dict} query={places[segment].mapsQuery} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-brand-primary-dark py-16 text-brand-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-heading text-4xl font-extrabold text-brand-background md:text-5xl">{dict.home.closeTitle}</h2>
            <p className="mt-4 text-lg text-brand-background">{dict.home.closeBody}</p>
          </div>
          <Link className={buttonClass("secondary", "w-full sm:w-auto")} href={`/${locale}/spin`}>
            {dict.home.primaryCta}
          </Link>
        </div>
      </section>
    </>
  );
}
