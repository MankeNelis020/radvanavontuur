import type { RoutesProvider } from "@/providers/types";
import { fetchWithTimeout } from "@/providers/http";

const MODE: Record<string, string> = {
  car: "DRIVE",
  bicycle: "BICYCLE",
  walking: "WALK",
  public_transport: "TRANSIT",
};

export function createRoutesProvider(): RoutesProvider {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      mode: "unavailable",
      label: "Google Routes is niet geconfigureerd",
      async quote() {
        return null;
      },
    };
  }
  return {
    mode: "live",
    label: "Google Routes",
    async quote({ origin, destination, mode }) {
      const travelMode = MODE[mode] ?? "DRIVE";
      const body: Record<string, unknown> = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: {
          location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
        },
        travelMode,
      };
      if (travelMode === "DRIVE") body.routingPreference = "TRAFFIC_UNAWARE";
      const response = await fetchWithTimeout("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        routes?: { duration?: string; distanceMeters?: number }[];
      };
      const route = payload.routes?.[0];
      if (!route?.duration || route.distanceMeters === undefined) return null;
      const seconds = Number(route.duration.replace("s", ""));
      if (!Number.isFinite(seconds)) return null;
      return {
        durationSeconds: seconds,
        distanceMeters: route.distanceMeters,
        source: "google_routes",
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}
