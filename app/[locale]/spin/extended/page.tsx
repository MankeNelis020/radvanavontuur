import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpinExperience } from "@/components/spin/SpinExperience";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).nav.extended };
}

export default async function ExtendedSpinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SpinExperience locale={locale} mode="extended" dict={getDictionary(locale)} />;
}
