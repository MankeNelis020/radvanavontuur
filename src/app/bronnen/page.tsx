import { authConfigured } from "@/auth/config";
import { getDictionary } from "@/i18n/locale";
import { sheetsConfigured } from "@/providers/sheets/google-sheets";
import { supabaseConfigured } from "@/persistence/supabase-store";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const { t } = await getDictionary();
  const weather = process.env.WEATHER_PROVIDER ?? "open-meteo";
  const rows = [
    [t.sources.catalog, t.sources.catalogDetail],
    [t.sources.weather, weather === "fixture" ? t.sources.weatherFixture : weather === "unavailable" ? t.sources.weatherOff : t.sources.weatherLive],
    [t.sources.places, process.env.GOOGLE_MAPS_API_KEY ? t.sources.placesOn : t.sources.placesOff],
    [t.sources.routes, process.env.GOOGLE_MAPS_API_KEY ? t.sources.routesOn : t.sources.routesOff],
    [t.sources.sheets, sheetsConfigured() ? t.sources.sheetsOn : t.sources.sheetsOff],
    [t.sources.supabase, supabaseConfigured() && authConfigured() ? t.sources.supabaseOn : t.sources.supabaseOff],
    [t.sources.ads, t.sources.adsOff],
  ];
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl text-forest-950">{t.sources.title}</h1>
      <ul className="mt-6 space-y-3">
        {rows.map(([name, detail]) => (
          <li key={name} className="rounded-card bg-cream-100 p-4">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-ink-soft">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
