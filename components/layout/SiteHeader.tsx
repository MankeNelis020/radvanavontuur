"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localizedPath, type Locale } from "@/lib/i18n/locale";
import { cx } from "@/lib/cx";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuPath(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/spin`, label: dict.nav.quick },
    { href: `/${locale}/spin/extended`, label: dict.nav.extended },
    { href: `/${locale}/itinerary`, label: dict.nav.itinerary },
    { href: `/${locale}/account`, label: dict.nav.account },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-brand-line bg-brand-background/90 backdrop-blur">
      <a className="skip-link" href="#main">
        {dict.nav.skip}
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3">
        <Link href={`/${locale}`} className="shrink-0 rounded-button">
          <Logo variant="compact" className="h-10 md:hidden" priority />
          <Logo variant="horizontal" className="hidden h-12 md:block" priority />
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitch locale={locale} dict={dict} pathname={pathname} />
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-button border border-brand-line px-4 font-heading text-sm font-bold text-brand-primary md:hidden"
            aria-expanded={open}
            onClick={() => setMenuPath(open ? null : pathname)}
          >
            {open ? dict.nav.close : dict.nav.menu}
          </button>
        </div>
      </div>
      <nav
        aria-label={dict.brand}
        className={cx(
          "mx-auto w-full max-w-6xl flex-col gap-1 px-5 pb-4 md:flex md:flex-row md:flex-wrap md:items-center md:gap-1 md:px-5 md:pb-3",
          open ? "flex" : "hidden md:flex",
        )}
      >
        {links.map((link) => {
          const active = link.href === `/${locale}` || link.href === `/${locale}/spin`
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-11 items-center rounded-button px-3 font-heading text-sm font-bold",
                active ? "bg-brand-highlight text-brand-primary" : "text-brand-text",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function LanguageSwitch({
  locale,
  dict,
  pathname,
}: {
  locale: Locale;
  dict: Dictionary;
  pathname: string;
}) {
  const options: Array<{ id: Locale; label: string; name: string }> = [
    { id: "en", label: "EN", name: dict.nav.english },
    { id: "nl", label: "NL", name: dict.nav.dutch },
  ];
  return (
    <div className="flex rounded-button border border-brand-line p-1" role="group" aria-label={dict.nav.language}>
      {options.map((option) => (
        <Link
          key={option.id}
          href={localizedPath(pathname, option.id)}
          hrefLang={option.id}
          aria-current={locale === option.id ? "true" : undefined}
          className={cx(
            "inline-flex min-h-10 min-w-11 items-center justify-center rounded-button px-3 font-heading text-sm font-bold",
            locale === option.id ? "bg-brand-primary text-brand-background" : "text-brand-primary",
          )}
        >
          <span aria-hidden="true">{option.label}</span>
          <span className="sr-only">{option.name}</span>
        </Link>
      ))}
    </div>
  );
}
