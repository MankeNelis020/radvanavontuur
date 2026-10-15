export const locales = ["en", "nl"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "nl";
}

export function localizedPath(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  if (parts[1] && isLocale(parts[1])) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
