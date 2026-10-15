import { describe, expect, it } from "vitest";
import { adventureCatalog } from "@/data/catalog";
import { haversineKm } from "@/domain/geo";
import { pickReturnStop } from "@/domain/itinerary";

describe("tussenstop", () => {
  it("slaat een plek op het startpunt over", () => {
    const catalog = adventureCatalog();
    const main = catalog.find((item) => item.id === "kasteel-de-haar");
    expect(main).toBeTruthy();
    if (!main) return;
    const origin = { lat: 52.09083, lng: 5.12222 };
    const stop = pickReturnStop({
      origin,
      main,
      options: catalog,
      participants: [{ id: "a", ageMonths: 34 * 12 }],
      accessibility: [],
      remainingBudgetEur: null,
      remainingMinutes: 180,
      seed: "utrecht-haar",
      blockedIds: [],
    });
    expect(stop?.destination.id).not.toBe("domtoren");
    if (!stop) return;
    const fromOrigin = haversineKm(origin, {
      lat: stop.destination.latitude,
      lng: stop.destination.longitude,
    });
    expect(fromOrigin).toBeGreaterThanOrEqual(0.75);
  });
});