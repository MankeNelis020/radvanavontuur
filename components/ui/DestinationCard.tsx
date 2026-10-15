import { PlaceScene } from "@/components/brand/PlaceScene";
import { MapActions } from "@/components/ui/MapActions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SegmentId } from "@/lib/types";

export function DestinationCard({
  dict,
  segment,
  title,
  summary,
  mapsQuery,
}: {
  dict: Dictionary;
  segment: SegmentId;
  title: string;
  summary: string;
  mapsQuery: string;
}) {
  return (
    <article className="overflow-hidden rounded-card border border-brand-line bg-brand-background shadow-soft">
      <div className="border-b border-brand-line">
        <PlaceScene segment={segment} />
      </div>
      <div className="space-y-3 p-5 md:p-6">
        <p className="font-heading text-sm font-bold text-brand-primary">{dict.segments[segment]}</p>
        <h3 className="font-heading text-2xl font-extrabold text-brand-primary-dark">{title}</h3>
        <p className="text-brand-text">{summary}</p>
        <MapActions dict={dict} query={mapsQuery} />
      </div>
    </article>
  );
}
