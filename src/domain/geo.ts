const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatKm(km: number): string {
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

/** Extra hemelsbrede kilometers via een tussenpunt. Geen reistijd. */
export function detourKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  stop: { lat: number; lng: number },
): number {
  const direct = haversineKm(destination, origin);
  const via = haversineKm(destination, stop) + haversineKm(stop, origin);
  return Math.max(0, via - direct);
}
