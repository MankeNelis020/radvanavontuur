import { headers } from "next/headers";
import { NotFoundState } from "@/components/status/NotFoundState";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";

export default async function RootNotFound() {
  const headerList = await headers();
  const raw = headerList.get("x-locale") ?? "en";
  const locale = isLocale(raw) ? raw : "en";
  return <NotFoundState dict={getDictionary(locale)} locale={locale} />;
}
