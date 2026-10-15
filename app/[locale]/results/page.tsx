import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultsScreen } from "@/components/results/ResultsScreen";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).results.title };
}

export default async function ResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ResultsScreen locale={locale} dict={getDictionary(locale)} />;
}
