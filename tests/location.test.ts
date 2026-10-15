import { describe, expect, it } from "vitest";
import { googleMapsDirectionsUrl, googleMapsShareUrl } from "@/domain/maps";
import { nearestPlaceLabel, placeLabelFromAddress } from "@/providers/geocoding/resolve-location";

describe("locatie delen", () => {
  it("maakt een plaatsnaam op gemeente-niveau", () => {
    expect(placeLabelFromAddress({ city: "Utrecht", state: "Utrecht" })).toBe("Utrecht");
    expect(placeLabelFromAddress({ city: "Haarzuilens", state: "Utrecht" })).toBe("Haarzuilens, Utrecht");
    expect(placeLabelFromAddress({})).toBeNull();
  });

  it("valt terug op een nabije plaats", () => {
    expect(nearestPlaceLabel(52.091, 5.122)).toBe("In de buurt van Utrecht");
    expect(nearestPlaceLabel(0, 0)).toBeNull();
  });

  it("zet een eigen punt alleen in de persoonlijke route", () => {
    const home = { lat: 52.09112, lng: 5.12188, name: "Jouw locatie" };
    const destination = { lat: 52.1215, lng: 4.9876, name: "Kasteel de Haar" };
    const personal = googleMapsDirectionsUrl({
      origin: home,
      destination,
      travelMode: "driving",
    });
    const shared = googleMapsShareUrl(destination);
    expect(decodeURIComponent(personal)).toContain("52.09112,5.12188");
    expect(decodeURIComponent(shared)).not.toContain("52.09112");
    expect(decodeURIComponent(shared)).toContain("52.1215,4.9876");
  });
});