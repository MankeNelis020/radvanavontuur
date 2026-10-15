import type { Dictionary } from "@/lib/i18n/dictionary";
import { mapsDirectionsUrl, mapsSearchUrl } from "@/lib/catalog";
import { buttonClass } from "./button-styles";

export function MapActions({ dict, query }: { dict: Dictionary; query: string }) {
  const linkClass = buttonClass("secondary", "w-full sm:w-auto");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a className={linkClass} href={mapsSearchUrl(query)} target="_blank" rel="noopener noreferrer">
        {dict.results.maps}
        <span className="sr-only"> ({dict.results.newTab})</span>
      </a>
      <a className={linkClass} href={mapsDirectionsUrl(query)} target="_blank" rel="noopener noreferrer">
        {dict.results.directions}
        <span className="sr-only"> ({dict.results.newTab})</span>
      </a>
    </div>
  );
}
