import type { Metadata, Viewport } from "next";
import { Inter, Nunito_Sans } from "next/font/google";
import { ConsentBar } from "@/components/consent/ConsentBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LocaleProvider } from "@/i18n/context";
import { getDictionary } from "@/i18n/locale";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: { default: t.meta.title, template: t.meta.template },
    description: t.tagline,
    applicationName: "Wondaro",
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  themeColor: "#103D32",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDictionary();
  return (
    <html lang={locale} className={`${inter.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased">
        <LocaleProvider locale={locale} dictionary={t}>
          <a
            href="#inhoud"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest-800 focus:px-4 focus:py-2 focus:text-cream-50"
          >
            {t.nav.skip}
          </a>
          <SiteHeader />
          <main id="inhoud">{children}</main>
          <SiteFooter />
          <ConsentBar />
        </LocaleProvider>
      </body>
    </html>
  );
}
