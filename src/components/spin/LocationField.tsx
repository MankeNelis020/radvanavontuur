"use client";

import { useState } from "react";
import { CITY_CENTERS } from "@/data/cities";
import { geolocationErrorMessage, readDevicePosition } from "@/components/location/device-position";
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
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function shareLocation() {
    setLocalError(null);
    setPending(true);
    try {
      const position = await readDevicePosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      let label = "Je gedeelde locatie";
      try {
        const response = await fetch("/api/locatie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: Number(lat.toFixed(2)), lng: Number(lng.toFixed(2)) }),
        });
        if (response.ok) {
          const body = (await response.json()) as { label?: string };
          if (body.label) label = body.label;
        }
      } catch {
        // Het precieze punt blijft bruikbaar, ook zonder plaatsnaam.
      }
      onQuery("");
      onOrigin({ lat, lng, label, source: "geolocation" });
    } catch (caught) {
      onOrigin(null);
      setLocalError(geolocationErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-2xl">Waar beginnen jullie?</legend>
      <p className="text-sm text-ink-soft">
        Deel je locatie als je vanaf je echte punt wilt draaien. Dat punt hoort bij dit avontuur en gaat niet mee in een deellink. Een plaatsnaam mag ook; dat is dan het plaatscentrum.
      </p>
      <button
        type="button"
        className="touch-target w-full rounded-full bg-forest-800 px-5 py-3 font-semibold text-cream-50 disabled:opacity-60"
        onClick={() => void shareLocation()}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Locatie delen…" : "Deel mijn locatie"}
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
          setLocalError(null);
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
      {origin?.source === "geolocation" ? (
        <p className="text-sm text-forest-800" role="status">
          Locatie gedeeld: {origin.label}. Het precieze punt gebruiken we voor de straal en gaat niet mee in een deellink.
        </p>
      ) : origin ? (
        <p className="text-sm text-forest-800">Gekozen: {origin.label}</p>
      ) : null}
      {localError || error ? (
        <p role="alert" className="text-sm font-semibold text-terracotta-700">
          {localError || error}
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
