"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/dictionary";
import { writeLocaleCookie } from "@/i18n/cookie";

export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    writeLocaleCookie(next);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {(
        [
          ["nl", "Nederlands"],
          ["en", "English"],
        ] as const
      ).map(([value, name]) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          className={`touch-target rounded-full px-3 py-2 text-sm font-semibold ${
            locale === value ? "bg-forest-800 text-cream-50" : "text-forest-800"
          }`}
          onClick={() => choose(value)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
