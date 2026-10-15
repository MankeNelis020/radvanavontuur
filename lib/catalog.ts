import type { SegmentId } from "./types";

/**
 * Illustrative places for the interface.
 * This is not a recommendation engine and not a paid listing.
 * Order and queries must not encode commercial preference.
 */
export const places: Record<SegmentId, { mapsQuery: string }> = {
  forest: { mapsQuery: "Nationaal Park Veluwezoom" },
  coast: { mapsQuery: "Scheveningen" },
  mountains: { mapsQuery: "Vaalserberg" },
  city: { mapsQuery: "Utrecht Dom Tower" },
  museum: { mapsQuery: "Rijksmuseum Amsterdam" },
  nearby: { mapsQuery: "Vondelpark" },
};

export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirectionsUrl(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
