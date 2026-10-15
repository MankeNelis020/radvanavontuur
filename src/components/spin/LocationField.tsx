"use client";

import { CITY_CENTERS } from "@/data/cities";
import type { Origin } from "@/domain/types";

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
          label: "Jouw locatie",
          source: "geolocation",
        });
      },
      () => onOrigin(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-2xl">Waar beginnen jullie?</legend>
      <p className="text-sm text-ink-soft">
        We vragen je locatie alleen als je dat toestaat. Een plaatsnaam mag ook. Die wordt een plaatscentrum, geen huisadres.
      </p>
      <button
        type="button"
        className="touch-target w-full rounded-full bg-forest-800 px-5 py-3 font-semibold text-cream-50"
        onClick={useBrowserLocation}
      >
        Gebruik mijn locatie
      </button>
      <label className="block text-sm font-semibold" htmlFor="plaats">
        Plaats of postcode
      </label>
      <input
        id="plaats"
        list="plaatsen"
        value={query}
        onChange={(event) => {
          onQuery(event.target.value);
          onOrigin(null);
        }}
        className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3"
        placeholder="Bijvoorbeeld Utrecht"
        autoComplete="address-level2"
      />
      <datalist id="plaatsen">
        {CITY_CENTERS.map((city) => (
          <option key={city.name} value={city.name} />
        ))}
      </datalist>
      {origin ? <p className="text-sm text-forest-800">Gekozen: {origin.label}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-terracotta-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function DistanceField({ value, onChange }: { value: number; onChange: (km: number) => void }) {
  const presets = [5, 15, 30, 50, 100];
  return (
    <fieldset>
      <legend className="font-display text-2xl">Hoe ver mag het zijn?</legend>
      <p className="mt-1 text-sm text-ink-soft">Dit is een straal in kilometers hemelsbreed, geen reistijd.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`touch-target rounded-full px-4 py-2 font-semibold ${value === preset ? "bg-gold-400" : "bg-cream-100"}`}
            onClick={() => onChange(preset)}
          >
            {preset} km
          </button>
        ))}
      </div>
      <label htmlFor="afstand" className="mt-4 block text-sm font-semibold">
        Maximaal {value} km
      </label>
      <input
        id="afstand"
        type="range"
        min={1}
        max={150}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-terracotta-500"
      />
    </fieldset>
  );
}
