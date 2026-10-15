import { cookies } from "next/headers";
import { dictionaries, LOCALE_COOKIE, type Copy, type Locale } from "@/i18n/dictionary";

export type { Copy, Locale };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "nl" || value === "en";
}

/** Dutch stays the default until a visitor chooses a language. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "nl";
}

export async function getDictionary(): Promise<{ locale: Locale; t: Copy }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

