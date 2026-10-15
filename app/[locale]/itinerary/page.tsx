import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItineraryScreen } from "@/components/itinerary/ItineraryScreen";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).nav.itinerary };
}

export default async function ItineraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ItineraryScreen locale={locale} dict={getDictionary(locale)} />;
}
