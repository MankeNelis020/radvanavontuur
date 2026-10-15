export type CityCenter = {
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  admin: string;
};

/** Plaatscentra via de Open-Meteo-geocoder, oktober 2026. Geen huisadressen. */
export const CITY_CENTERS: CityCenter[] = [
  { name: "Amsterdam", aliases: ["amsterdam"], lat: 52.37403, lng: 4.88969, admin: "Noord-Holland" },
  { name: "Rotterdam", aliases: ["rotterdam"], lat: 51.9225, lng: 4.47917, admin: "Zuid-Holland" },
  { name: "Den Haag", aliases: ["den haag", "s-gravenhage", "'s-gravenhage", "the hague"], lat: 52.07667, lng: 4.29861, admin: "Zuid-Holland" },
  { name: "Utrecht", aliases: ["utrecht"], lat: 52.09083, lng: 5.12222, admin: "Utrecht" },
  { name: "Eindhoven", aliases: ["eindhoven"], lat: 51.44083, lng: 5.47778, admin: "Noord-Brabant" },
  { name: "Groningen", aliases: ["groningen"], lat: 53.21917, lng: 6.56667, admin: "Groningen" },
  { name: "Tilburg", aliases: ["tilburg"], lat: 51.55551, lng: 5.0913, admin: "Noord-Brabant" },
  { name: "Almere", aliases: ["almere"], lat: 52.37025, lng: 5.21413, admin: "Flevoland" },
  { name: "Breda", aliases: ["breda"], lat: 51.58656, lng: 4.77596, admin: "Noord-Brabant" },
  { name: "Nijmegen", aliases: ["nijmegen"], lat: 51.8425, lng: 5.85278, admin: "Gelderland" },
  { name: "Arnhem", aliases: ["arnhem"], lat: 51.98, lng: 5.91111, admin: "Gelderland" },
  { name: "Haarlem", aliases: ["haarlem"], lat: 52.38084, lng: 4.63683, admin: "Noord-Holland" },
  { name: "Amersfoort", aliases: ["amersfoort"], lat: 52.155, lng: 5.3875, admin: "Utrecht" },
  { name: "Apeldoorn", aliases: ["apeldoorn"], lat: 52.21, lng: 5.96944, admin: "Gelderland" },
  { name: "Enschede", aliases: ["enschede"], lat: 52.21833, lng: 6.89583, admin: "Overijssel" },
  { name: "Leiden", aliases: ["leiden"], lat: 52.15833, lng: 4.49306, admin: "Zuid-Holland" },
  { name: "Maastricht", aliases: ["maastricht"], lat: 50.84833, lng: 5.68889, admin: "Limburg" },
  { name: "Dordrecht", aliases: ["dordrecht"], lat: 51.81, lng: 4.67361, admin: "Zuid-Holland" },
  { name: "Zoetermeer", aliases: ["zoetermeer"], lat: 52.0575, lng: 4.49306, admin: "Zuid-Holland" },
  { name: "Zwolle", aliases: ["zwolle"], lat: 52.5125, lng: 6.09444, admin: "Overijssel" },
  { name: "Delft", aliases: ["delft"], lat: 52.00667, lng: 4.35556, admin: "Zuid-Holland" },
  { name: "Deventer", aliases: ["deventer"], lat: 52.255, lng: 6.16389, admin: "Overijssel" },
  { name: "Leeuwarden", aliases: ["leeuwarden"], lat: 53.20271, lng: 5.80973, admin: "Friesland" },
  { name: "Alkmaar", aliases: ["alkmaar"], lat: 52.63167, lng: 4.74861, admin: "Noord-Holland" },
  { name: "Hilversum", aliases: ["hilversum"], lat: 52.22333, lng: 5.17639, admin: "Noord-Holland" },
  { name: "Amstelveen", aliases: ["amstelveen"], lat: 52.30083, lng: 4.86389, admin: "Noord-Holland" },
  { name: "Zaandam", aliases: ["zaandam"], lat: 52.43854, lng: 4.82643, admin: "Noord-Holland" },
  { name: "Hoofddorp", aliases: ["hoofddorp"], lat: 52.3025, lng: 4.68889, admin: "Noord-Holland" },
  { name: "Oss", aliases: ["oss"], lat: 51.765, lng: 5.51806, admin: "Noord-Brabant" },
  { name: "Schiedam", aliases: ["schiedam"], lat: 51.91917, lng: 4.38889, admin: "Zuid-Holland" },
  { name: "Gouda", aliases: ["gouda"], lat: 52.01667, lng: 4.70833, admin: "Zuid-Holland" },
  { name: "Heerlen", aliases: ["heerlen"], lat: 50.88365, lng: 5.98154, admin: "Limburg" },
  { name: "Ede", aliases: ["ede"], lat: 52.03333, lng: 5.65833, admin: "Gelderland" },
  { name: "Venlo", aliases: ["venlo"], lat: 51.37, lng: 6.16806, admin: "Limburg" },
  { name: "Helmond", aliases: ["helmond"], lat: 51.48167, lng: 5.66111, admin: "Noord-Brabant" },
  { name: "Lelystad", aliases: ["lelystad"], lat: 52.50833, lng: 5.475, admin: "Flevoland" },
  { name: "Middelburg", aliases: ["middelburg"], lat: 51.5, lng: 3.61389, admin: "Zeeland" },
  { name: "Assen", aliases: ["assen"], lat: 52.99667, lng: 6.5625, admin: "Drenthe" },
  { name: "Emmen", aliases: ["emmen"], lat: 52.77917, lng: 6.90694, admin: "Drenthe" },
];

export function findCity(query: string): CityCenter | null {
  const normalized = query.trim().toLowerCase().replace(/['’]/g, "");
  if (!normalized) return null;
  return (
    CITY_CENTERS.find(
      (city) =>
        city.name.toLowerCase() === normalized ||
        city.aliases.some((alias) => alias.replace(/['’]/g, "") === normalized),
    ) ?? null
  );
}
