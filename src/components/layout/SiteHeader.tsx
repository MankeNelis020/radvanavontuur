import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
      <Link href="/" className="font-display text-2xl text-forest-950">
        Rad van Avontuur
      </Link>
      <nav aria-label="Hoofdmenu" className="flex items-center gap-3 text-sm font-semibold text-forest-800">
        <Link href="/over" className="rounded-full px-3 py-2 hover:bg-cream-100">
          Over
        </Link>
        <Link href="/account" className="rounded-full bg-forest-800 px-3 py-2 text-cream-50">
          Account
        </Link>
      </nav>
    </header>
  );
}
