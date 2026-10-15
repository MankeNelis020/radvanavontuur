"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui/button-styles";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/locale";

export function ErrorState({ reset }: { reset: () => void }) {
  const [locale, setLocale] = useState<Locale | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const lang = document.documentElement.lang;
      setLocale(isLocale(lang) ? lang : "en");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!locale) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Logo variant="icon" className="h-16" />
      </div>
    );
  }

  const dict = getDictionary(locale);
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-start justify-center gap-4 px-5 py-16">
      <Logo variant="icon" className="h-14" />
      <h1 className="font-heading text-4xl font-extrabold">{dict.status.errorTitle}</h1>
      <p className="text-lg">{dict.status.errorBody}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className={buttonClass("primary")} onClick={reset}>
          {dict.status.retry}
        </button>
        <Link className={buttonClass("secondary")} href={`/${locale}`}>
          {dict.status.back}
        </Link>
      </div>
    </div>
  );
}
