import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-5xl px-4 pb-28 text-sm text-ink-soft">
      <div className="grid gap-3 border-t border-cream-200 pt-6 sm:grid-cols-3">
        <p>Jij bepaalt de grenzen. Het rad bepaalt het avontuur.</p>
        <nav aria-label="Voettekst" className="flex flex-col gap-1">
          <Link href="/privacy">Privacy</Link>
          <Link href="/bronnen">Databronnen</Link>
          <Link href="/geschiedenis">Geschiedenis</Link>
          <Link href="/favorieten">Favorieten</Link>
        </nav>
        <p>Commerciële afspraken veranderen de kans op een bestemming niet.</p>
      </div>
    </footer>
  );
}
