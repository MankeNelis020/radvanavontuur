/**
 * Eenmalige verrijking van cataloguscoördinaten via Nominatim.
 * Gebruik: node scripts/geocode-catalog.mjs
 * Beleid: maximaal één verzoek per seconde, herkenbare User-Agent.
 */
import { writeFileSync } from "node:fs";

const SEED = [
  ["rijksmuseum", "Rijksmuseum Museumstraat Amsterdam"],
  ["van-gogh-museum", "Van Gogh Museum Museumplein Amsterdam"],
  ["artis", "ARTIS Amsterdam"],
  ["vondelpark", "Vondelpark Amsterdam"],
  ["nemo", "NEMO Science Museum Amsterdam"],
  ["efteling", "Efteling Kaatsheuvel"],
  ["madurodam", "Madurodam Den Haag"],
  ["mauritshuis", "Mauritshuis Den Haag"],
  ["scheveningen", "Scheveningen strand Den Haag"],
  ["biesbosch", "Biesboschcentrum Dordrecht"],
  ["kinderdijk", "Kinderdijk molens"],
  ["kroller-muller", "Kröller-Müller Museum Otterlo"],
  ["hoge-veluwe", "Nationaal Park De Hoge Veluwe"],
  ["ouwehands", "Ouwehands Dierenpark Rhenen"],
  ["burgers-zoo", "Burgers Zoo Arnhem"],
  ["openluchtmuseum", "Nederlands Openluchtmuseum Arnhem"],
  ["zuiderzeemuseum", "Zuiderzeemuseum Enkhuizen"],
  ["giethoorn", "Giethoorn"],
  ["zaanse-schans", "Zaanse Schans Zaandam"],
  ["blijdorp", "Diergaarde Blijdorp Rotterdam"],
  ["markthal", "Markthal Rotterdam"],
  ["kop-van-zuid", "Erasmusbrug Rotterdam"],
  ["domtoren", "Domtoren Utrecht"],
  ["nijntje-museum", "Nijntje Museum Utrecht"],
  ["spoorwegmuseum", "Spoorwegmuseum Utrecht"],
  ["naturalis", "Naturalis Biodiversity Center Leiden"],
  ["hortus-leiden", "Hortus Botanicus Leiden"],
  ["kasteel-de-haar", "Kasteel de Haar Haarzuilens"],
  ["muiderslot", "Muiderslot Muiden"],
  ["loevestein", "Slot Loevestein"],
  ["beekse-bergen", "Beekse Bergen Hilvarenbeek"],
  ["avifauna", "Avifauna Alphen aan den Rijn"],
  ["duinrell", "Duinrell Wassenaar"],
  ["wereldmuseum", "Wereldmuseum Amsterdam"],
  ["posbank", "Posbank Rheden"],
  ["amsterdamse-bos", "Amsterdamse Bos"],
  ["keukenhof", "Keukenhof Lisse"],
  ["corpus", "Corpus Leiden"],
  ["heineken-experience", "Heineken Experience Amsterdam"],
  ["straat-museum", "STRAAT Museum Amsterdam"],
  ["speelklok", "Museum Speelklok Utrecht"],
  ["foodhallen", "Foodhallen Amsterdam Bellamyplein"],
  ["de-jaren", "Café de Jaren Amsterdam"],
  ["winkel-van-sinkel", "Winkel van Sinkel Utrecht"],
  ["fenix-food", "Fenix Food Factory Rotterdam"],
  ["pllek", "Pllek Amsterdam"],
  ["hotel-new-york", "Hotel New York Rotterdam"],
];

const results = [];
for (const [id, query] of SEED) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "nl");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "RadVanAvontuur/0.1 (catalog build; local development)",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    results.push({ id, query, error: response.status });
  } else {
    const body = await response.json();
    const hit = body[0];
    results.push({
      id,
      query,
      name: hit?.name || hit?.display_name || null,
      lat: hit ? Number(hit.lat) : null,
      lng: hit ? Number(hit.lon) : null,
      displayName: hit?.display_name ?? null,
      osmType: hit?.osm_type ?? null,
      osmId: hit?.osm_id ?? null,
      licence: "© OpenStreetMap contributors, ODbL",
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 1100));
}

writeFileSync("src/data/geocoded.json", JSON.stringify(results, null, 2));
console.log(`Wrote ${results.length} rows`);
