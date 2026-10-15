import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { getDictionary } from "@/i18n/locale";

export async function SiteHeader() {
  const { locale, t } = await getDictionary();
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href="/" className="inline-flex items-center">
        <Image src="/brand/logo-compact.svg" alt={t.brand} width={347} height={96} className="h-10 w-auto md:hidden" />
        <Image src="/brand/logo-horizontal.svg" alt={t.brand} width={478} height={128} className="hidden h-12 w-auto md:block" />
      </Link>
      <nav aria-label={t.nav.main} className="flex flex-wrap items-center gap-2 text-sm font-semibold text-forest-800">
        <LanguageSwitch locale={locale} label={t.nav.language} />
        <Link href="/over" className="touch-target inline-flex items-center rounded-full px-3 py-2 hover:bg-cream-100">
          {t.nav.about}
        </Link>
        <Link href="/account" className="touch-target inline-flex items-center rounded-full bg-forest-800 px-3 py-2 text-cream-50">
          {t.nav.account}
        </Link>
      </nav>
    </header>
  );
}
