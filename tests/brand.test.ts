import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaries } from "../src/i18n/dictionary";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return ["array", value.length];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    );
  }
  return "string";
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("Wondaro brand", () => {
  it("keeps the palette in one stylesheet", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    for (const token of ["#103D32", "#082C26", "#E8AD42", "#FFF8EB", "#F1E5CE", "#91AD91", "#C97852", "#21352F"]) {
      expect(css).toContain(token);
    }
    expect(css).toContain("--radius-card: 24px");
    expect(css).toContain("--radius-button: 999px");
    expect(css).toContain("--radius-input: 14px");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("gives Dutch and English the same shape", () => {
    expect(shape(dictionaries.en)).toEqual(shape(dictionaries.nl));
  });

  it("uses the required brand lines", () => {
    expect(dictionaries.en.tagline).toBe("Your next adventure starts with a spin.");
    expect(dictionaries.en.whereNext).toBe("Where to next?");
    expect(dictionaries.en.spinWheel).toBe("Spin the wheel");
    expect(dictionaries.en.discover).toBe("Discover your adventure");
    expect(dictionaries.en.makeToday).toBe("Make today an adventure");
    expect(dictionaries.nl.tagline).toBe("Je volgende avontuur begint met een draai.");
    expect(dictionaries.nl.whereNext).toBe("Waar gaan we heen?");
    expect(dictionaries.nl.spinWheel).toBe("Draai het rad");
    expect(dictionaries.nl.discover).toBe("Ontdek je avontuur");
    expect(dictionaries.nl.makeToday).toBe("Maak van vandaag een avontuur");
  });

  it("keeps the Dutch labels the existing flows rely on", () => {
    expect(dictionaries.nl.home.quick).toBe("Snel draaien");
    expect(dictionaries.nl.quick.submit).toBe("Naar het rad");
    expect(dictionaries.nl.extended.next).toBe("Volgende");
    expect(dictionaries.nl.result.accept).toBe("Dit wordt 'm!");
    expect(dictionaries.nl.result.maps).toBe("Open in Google Maps");
    expect(dictionaries.nl.result.addLunch).toBe("Voeg lunch toe");
    expect(dictionaries.nl.result.addStop).toBe("Voeg tussenstop toe");
    expect(dictionaries.nl.result.respin).toBe("Eén keer opnieuw draaien");
    expect(dictionaries.nl.result.respinAgain).toBe("Draai opnieuw");
    expect(dictionaries.nl.result.respinUsed).toBe("Herkansing gebruikt");
    expect(dictionaries.nl.account.intro).toBe("Niet verplicht. Met een account bewaar je avonturen, favorieten en reviews.");
    expect(dictionaries.nl.place.query).toBe("Plaats of postcode");
  });

  it("does not scatter hex colours through the interface", () => {
    const allowed = new Set([path.normalize("src/app/globals.css"), path.normalize("src/app/manifest.ts"), path.normalize("src/app/layout.tsx")]);
    const leaks = files("src").flatMap((file) => {
      if (allowed.has(path.normalize(file))) return [];
      const hits = readFileSync(file, "utf8").match(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g);
      return hits ? [`${file}: ${hits.join(", ")}`] : [];
    });
    expect(leaks).toEqual([]);
  });
});
