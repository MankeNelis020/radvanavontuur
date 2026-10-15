"use client";

import { createContext, useContext } from "react";
import type { Copy, Locale } from "@/i18n/dictionary";

const LocaleContext = createContext<{ locale: Locale; t: Copy } | null>(null);

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Copy;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, t: dictionary }}>{children}</LocaleContext.Provider>;
}

export function useCopy(): { locale: Locale; t: Copy } {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is missing");
  return value;
}
