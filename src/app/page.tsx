import Link from "next/link";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { getDictionary } from "@/i18n/locale";

export default async function HomePage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-5xl px-4">
      <RegisterServiceWorker />
      <section className="grid items-center gap-10 py-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest-700">{t.whereNext}</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-forest-950 sm:text-6xl">{t.tagline}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">{t.home.lead}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/snel"
              className="touch-target inline-flex items-center justify-center rounded-full bg-forest-800 px-6 py-3 font-display text-lg font-semibold text-cream-50"
            >
              {t.home.quick}
            </Link>
            <Link
              href="/uitgebreid"
              className="touch-target inline-flex items-center justify-center rounded-full border border-forest-800/20 bg-cream-100 px-6 py-3 font-display text-lg font-semibold text-forest-800"
            >
              {t.home.extended}
            </Link>
          </div>
        </div>
        <div aria-hidden className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="hero-wheel absolute inset-6 rounded-full border-[14px] border-forest-800" />
          <div className="absolute top-4 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[26px] border-x-transparent border-t-forest-950" />
          <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream-50 shadow-soft" />
          <div className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {t.home.cards.map(([title, text]) => (
          <article key={title} className="rounded-card bg-cream-100 p-5 shadow-soft">
            <h2 className="font-display text-2xl text-forest-950">{title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{text}</p>
          </article>
        ))}
      </section>
      <section className="mt-10 rounded-card bg-forest-950 px-6 py-10 text-cream-50">
        <h2 className="font-display text-4xl text-cream-50">{t.makeToday}</h2>
        <p className="mt-3 max-w-xl text-cream-100">{t.discover}</p>
      </section>
    </div>
  );
}
