import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ConsentBar } from "@/components/consent/ConsentBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: "Rad van Avontuur", template: "%s · Rad van Avontuur" },
  description: "Jij bepaalt de grenzen. Het rad bepaalt het avontuur.",
  applicationName: "Rad van Avontuur",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#17352a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#inhoud" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold-400 focus:px-4 focus:py-2">
          Naar de inhoud
        </a>
        <SiteHeader />
        <main id="inhoud">{children}</main>
        <SiteFooter />
        <ConsentBar />
      </body>
    </html>
  );
}
