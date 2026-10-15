export type MapPoint = {
  lat: number;
  lng: number;
  name: string;
  placeId?: string | null;
};

export type TravelModeParam = "driving" | "bicycling" | "walking" | "transit";

export function travelModeParam(
  mode: "car" | "bicycle" | "walking" | "public_transport" | null,
): TravelModeParam {
  if (mode === "bicycle") return "bicycling";
  if (mode === "walking") return "walking";
  if (mode === "public_transport") return "transit";
  return "driving";
}

function pointQuery(point: MapPoint): string {
  return `${point.lat},${point.lng}`;
}

/** Route voor de gebruiker zelf. De oorsprong mag hierin staan. */
export function googleMapsDirectionsUrl(input: {
  origin: MapPoint | null;
  destination: MapPoint;
  waypoints?: MapPoint[];
  travelMode: TravelModeParam;
  roundTrip?: boolean;
}): string {
  const params = new URLSearchParams({ api: "1", travelmode: input.travelMode });
  const waypoints = input.waypoints ?? [];
  if (input.roundTrip && input.origin) {
    params.set("origin", pointQuery(input.origin));
    params.set("destination", pointQuery(input.origin));
    const via = [input.destination, ...waypoints];
    params.set("waypoints", via.map(pointQuery).join("|"));
  } else {
    if (input.origin) params.set("origin", pointQuery(input.origin));
    params.set("destination", pointQuery(input.destination));
    if (input.destination.placeId) params.set("destination_place_id", input.destination.placeId);
    if (waypoints.length > 0) params.set("waypoints", waypoints.map(pointQuery).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Gedeelde link: nooit een privéstartpunt. */
export function googleMapsShareUrl(destination: MapPoint, waypoints: MapPoint[] = []): string {
  return googleMapsDirectionsUrl({
    origin: null,
    destination,
    waypoints,
    travelMode: "driving",
  });
}

export function googleMapsPlaceUrl(point: MapPoint): string {
  const params = new URLSearchParams({
    api: "1",
    query: point.placeId ? point.name : pointQuery(point),
  });
  if (point.placeId) params.set("query_place_id", point.placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
