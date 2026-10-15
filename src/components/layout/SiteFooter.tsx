import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/locale";

export async function SiteFooter() {
  const { t } = await getDictionary();
  return (
    <footer className="mx-auto mt-16 w-full max-w-5xl px-4 pb-28 text-sm text-ink-soft">
      <div className="grid gap-4 border-t border-cream-200 pt-6 sm:grid-cols-3">
        <div className="space-y-3">
          <Image src="/brand/logo-compact.svg" alt="" width={347} height={96} className="h-8 w-auto" />
          <p>{t.tagline}</p>
        </div>
        <nav aria-label={t.nav.footer} className="flex flex-col gap-1">
          <Link href="/privacy" className="touch-target inline-flex items-center">
            {t.footer.privacy}
          </Link>
          <Link href="/bronnen" className="touch-target inline-flex items-center">
            {t.footer.sources}
          </Link>
          <Link href="/geschiedenis" className="touch-target inline-flex items-center">
            {t.footer.history}
          </Link>
          <Link href="/favorieten" className="touch-target inline-flex items-center">
            {t.footer.favorites}
          </Link>
        </nav>
        <p>{t.footer.independence}</p>
      </div>
    </footer>
  );
}
