import Link from "next/link";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <RegisterServiceWorker />
      <section className="grid items-center gap-10 py-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-terracotta-700">Spontaan eropuit</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-forest-950 sm:text-6xl">
            Jij bepaalt de grenzen. Het rad bepaalt het avontuur.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Geen eindeloos vergelijken. Eén draai kiest een echt uitje voor jouw gezelschap. Hooguit één herkansing, en niemand kan een plek kopen in het rad.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/snel" className="touch-target inline-flex items-center justify-center rounded-full bg-terracotta-500 px-6 py-3 text-lg font-semibold text-cream-50">
              Snel draaien
            </Link>
            <Link href="/uitgebreid" className="touch-target inline-flex items-center justify-center rounded-full bg-forest-800 px-6 py-3 text-lg font-semibold text-cream-50">
              Uitgebreid kiezen
            </Link>
          </div>
        </div>
        <div aria-hidden className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-6 rounded-full border-[18px] border-forest-800 bg-[conic-gradient(#1e4636_0_25%,#c4653a_0_45%,#e2b340_0_68%,#f3eadc_0_100%)] shadow-2xl" />
          <div className="absolute top-4 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[16px] border-t-[30px] border-x-transparent border-t-forest-950" />
          <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream-50 shadow-inner" />
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Eén draai", "Het rad stopt op de bestemming die de motor al koos. Geen schijnbeweging."],
          ["Echte plekken", "Namen en coördinaten komen uit een gecontroleerde catalogus of een live bron. Ontbrekende prijzen en tijden blijven onbekend."],
          ["Zonder account", "Draaien, accepteren en Maps openen kan meteen. Bewaren en reviews komen erbij als je wilt."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-[2rem] bg-white/80 p-5 shadow-sm">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
