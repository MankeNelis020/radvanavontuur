type Placement = "below-form" | "below-result" | "itinerary";

const copy: Record<Placement, string> = {
  "below-form": "Onder het formulier",
  "below-result": "Onder de uitslag",
  itinerary: "Bij de route",
};

export function AdSlot({ placement }: { placement: Placement }) {
  return (
    <aside
      aria-label="Advertentieruimte, niet actief"
      data-placement={placement}
      className="rounded-3xl border border-dashed border-forest-700/30 bg-cream-50/70 px-4 py-3 text-sm text-ink-soft"
    >
      <p className="font-semibold text-ink">Advertentieruimte</p>
      <p>
        {copy[placement]}. Nog niet actief. Een advertentie kan het rad niet draaien en lijkt hier niet op een knop.
      </p>
    </aside>
  );
}
