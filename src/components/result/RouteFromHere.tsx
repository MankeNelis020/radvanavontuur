"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { geolocationErrorMessage, readDevicePosition } from "@/components/location/device-position";
import { googleMapsDirectionsUrl, type MapPoint, type TravelModeParam } from "@/domain/maps";

export function RouteFromHere({
  destination,
  waypoints,
  travelMode,
  destinationHref,
}: {
  destination: MapPoint;
  waypoints: MapPoint[];
  travelMode: TravelModeParam;
  destinationHref: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [href, setHref] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setPending(true);
    setError(null);
    try {
      const position = await readDevicePosition();
      setHref(
        googleMapsDirectionsUrl({
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Jouw locatie",
          },
          destination,
          waypoints,
          travelMode,
        }),
      );
    } catch (caught) {
      setHref(null);
      setError(geolocationErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Deel je eigen locatie als je de route vanaf hier wilt. Dat punt blijft in deze browser en wordt niet bij het avontuur opgeslagen.
      </p>
      <Button type="button" className="w-full" disabled={pending} onClick={() => void share()}>
        {pending ? "Locatie delen…" : "Deel je locatie"}
      </Button>
      {href ? (
        <a
          className="touch-target flex w-full items-center justify-center rounded-full bg-forest-800 px-5 py-3 text-lg font-semibold text-cream-50"
          href={href}
        >
          Open de route vanaf hier
        </a>
      ) : null}
      {destinationHref ? (
        <a className="block text-center text-sm font-semibold text-forest-800 underline" href={destinationHref}>
          Open alleen de bestemming
        </a>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-terracotta-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
