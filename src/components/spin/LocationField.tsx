"use client";

import { CITY_CENTERS } from "@/data/cities";
import type { Origin } from "@/domain/types";
import { fill } from "@/i18n/dictionary";
import { useCopy } from "@/i18n/context";
import { choiceClass, fieldClass } from "@/components/ui/choice";

export function LocationField({
  origin,
  query,
  onQuery,
  onOrigin,
  error,
}: {
  origin: Origin | null;
  query: string;
  onQuery: (value: string) => void;
  onOrigin: (origin: Origin | null) => void;
  error: string | null;
}) {
  const { t } = useCopy();

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      onOrigin(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: t.place.here,
          source: "geolocation",
        });
      },
      () => onOrigin(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-2xl text-forest-950">{t.place.legend}</legend>
      <p className="text-sm text-ink-soft">{t.place.hint}</p>
      <button type="button" className="touch-target w-full rounded-full bg-forest-800 px-5 py-3 font-display font-semibold text-cream-50" onClick={useBrowserLocation}>
        {t.place.useLocation}
      </button>
      <label className="block text-sm font-semibold" htmlFor="plaats">
        {t.place.query}
      </label>
      <input
        id="plaats"
        list="plaatsen"
        value={query}
        onChange={(event) => {
          onQuery(event.target.value);
          onOrigin(null);
        }}
        className={fieldClass}
        placeholder={t.place.placeholder}
        autoComplete="address-level2"
      />
      <datalist id="plaatsen">
        {CITY_CENTERS.map((city) => (
          <option key={city.name} value={city.name} />
        ))}
      </datalist>
      {origin ? <p className="text-sm text-forest-800">{fill(t.place.chosen, { label: origin.label })}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-terracotta-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function DistanceField({ value, onChange }: { value: number; onChange: (km: number) => void }) {
  const { t } = useCopy();
  const presets = [5, 15, 30, 50, 100];
  return (
    <fieldset>
      <legend className="font-display text-2xl text-forest-950">{t.distance.legend}</legend>
      <p className="mt-1 text-sm text-ink-soft">{t.distance.hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button key={preset} type="button" className={choiceClass(value === preset)} onClick={() => onChange(preset)}>
            {fill(t.distance.km, { value: preset })}
          </button>
        ))}
      </div>
      <label htmlFor="afstand" className="mt-4 block text-sm font-semibold">
        {fill(t.distance.max, { value })}
      </label>
      <input id="afstand" type="range" min={1} max={150} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-forest-800" />
    </fieldset>
  );
}
