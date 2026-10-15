import type { Metadata } from "next";
import { Inter, Nunito_Sans } from "next/font/google";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/locale";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const locale = headerList.get("x-locale") === "nl" ? "nl" : "en";
  const dict = getDictionary(locale);
  return {
    title: {
      default: `${dict.brand} — ${dict.tagline}`,
      template: `%s — ${dict.brand}`,
    },
    description: dict.tagline,
    applicationName: dict.brand,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const raw = headerList.get("x-locale") ?? "en";
  const locale = isLocale(raw) ? raw : "en";

  return (
    <html lang={locale} className={`${inter.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col font-body antialiased">{children}</body>
    </html>
  );
}
