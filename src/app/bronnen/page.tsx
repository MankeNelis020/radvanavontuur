import { authConfigured } from "@/auth/config";
import { sheetsConfigured } from "@/providers/sheets/google-sheets";
import { supabaseConfigured } from "@/persistence/supabase-store";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  const weather = process.env.WEATHER_PROVIDER ?? "open-meteo";
  const rows = [
    ["Eigen catalogus", "Actief. Coördinaten uit OpenStreetMap. Prijzen en openingstijden alleen als ze echt bekend zijn."],
    ["Open-Meteo", weather === "fixture" ? "Teststand. Geen live weer." : weather === "unavailable" ? "Uitgeschakeld." : "Live modelverwachting. Geen officiële KNMI-waarschuwing."],
    ["Google Places", process.env.GOOGLE_MAPS_API_KEY ? "Sleutel aanwezig." : "Niet geconfigureerd. Alleen de eigen catalogus."],
    ["Google Routes", process.env.GOOGLE_MAPS_API_KEY ? "Sleutel aanwezig. Reistijd alleen bij een echt antwoord." : "Niet geconfigureerd. Geen verzonnen reistijd."],
    ["Google Sheets", sheetsConfigured() ? "Klaar om te synchroniseren." : "Niet geconfigureerd."],
    ["Supabase", supabaseConfigured() && authConfigured() ? "Opslag en accounts geconfigureerd." : "Niet geconfigureerd. Ontwikkelopslag op deze server."],
    ["Advertenties", "Niet actief."],
  ];
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-4xl">Databronnen</h1>
      <ul className="mt-6 space-y-3">
        {rows.map(([name, detail]) => (
          <li key={name} className="rounded-3xl bg-white p-4">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-ink-soft">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
