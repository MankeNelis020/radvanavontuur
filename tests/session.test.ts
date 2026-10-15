import { afterEach, describe, expect, it } from "vitest";
import { addLunch, addReturnStop, createAdventure, replaceAdventure, respinAdventure } from "@/application/adventures";
import { submitReview } from "@/application/reviews";
import { googleMapsShareUrl } from "@/domain/maps";
import { resolvePreferences } from "@/domain/preferences";
import { createMemoryStore } from "@/persistence/memory-store";
import { setStoreForTests } from "@/persistence/get-store";

describe("sessieregels", () => {
  afterEach(() => setStoreForTests(null));

  it("staat één herkansing toe, sluit de eerste plek uit en houdt vervanging apart", async () => {
    const store = createMemoryStore();
    setStoreForTests(store);
    const created = await createAdventure({
      ownerToken: "gast",
      userId: null,
      visitedIds: [],
      preferences: resolvePreferences(
        {
          mode: "quick",
          participants: [{ id: "a", ageMonths: 30 * 12 }],
          origin: { lat: 52.09083, lng: 5.12222, label: "Utrecht", source: "gazetteer" },
          maxDistanceKm: 40,
        },
        new Date("2026-06-15T10:00:00.000Z"),
      ),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const firstId = created.session.selections[0]?.destination.id;
    const replaced = await replaceAdventure({ sessionId: created.session.id, ownerToken: "gast" });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    expect(replaced.session.respinUsed).toBe(false);
    expect(replaced.session.operationalReplacements).toBe(1);
    const again = await respinAdventure({
      sessionId: created.session.id,
      ownerToken: "gast",
      reason: "want_different",
      note: "iets anders",
    });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.session.respinUsed).toBe(true);
    expect(again.session.selections.at(-1)?.destination.id).not.toBe(firstId);
    expect(again.session.selections.at(-1)?.kind).toBe("respin");
    const blocked = await respinAdventure({
      sessionId: created.session.id,
      ownerToken: "gast",
      reason: "other",
      note: null,
    });
    expect(blocked.ok).toBe(false);
  });

  it("weigert een review zonder eigen bevestiging", async () => {
    const store = createMemoryStore();
    setStoreForTests(store);
    const created = await createAdventure({
      ownerToken: "gast",
      userId: "user-1",
      visitedIds: [],
      preferences: resolvePreferences(
        {
          mode: "quick",
          participants: [{ id: "a", ageMonths: 40 * 12 }],
          origin: { lat: 52.37, lng: 4.89, label: "Amsterdam", source: "gazetteer" },
          maxDistanceKm: 20,
        },
        new Date("2026-06-15T10:00:00.000Z"),
      ),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const denied = await submitReview({
      sessionId: created.session.id,
      ownerToken: "gast",
      userId: "user-1",
      rating: 4,
      body: "Mooi",
      tags: ["Rustige omgeving"],
    });
    expect(denied.ok).toBe(false);
    created.session.status = "visit_self_confirmed";
    await store.saveSession(created.session);
    const allowed = await submitReview({
      sessionId: created.session.id,
      ownerToken: "gast",
      userId: "user-1",
      rating: 4,
      body: "Mooi",
      tags: ["Rustige omgeving"],
    });
    expect(allowed.ok).toBe(true);
  });

  it("kan lunch en een tussenstop toevoegen zonder een nieuwe hoofddraai", async () => {
    const store = createMemoryStore();
    setStoreForTests(store);
    const created = await createAdventure({
      ownerToken: "gast",
      userId: null,
      visitedIds: [],
      preferences: resolvePreferences(
        {
          mode: "quick",
          participants: [{ id: "a", ageMonths: 28 * 12 }],
          origin: { lat: 52.37, lng: 4.89, label: "Amsterdam", source: "gazetteer" },
          maxDistanceKm: 15,
          budgetEur: null,
        },
        new Date("2026-06-15T10:00:00.000Z"),
      ),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const before = created.session.selections.length;
    const lunch = await addLunch(created.session.id, "gast");
    const stop = await addReturnStop(created.session.id, "gast");
    const after = await store.getSession(created.session.id);
    expect(after?.selections).toHaveLength(before);
    expect(lunch.ok || stop.ok).toBe(true);
  });

  it("zet geen privéstartpunt in een deel-link", () => {
    const url = googleMapsShareUrl({ lat: 52.09, lng: 5.12, name: "Domtoren" });
    expect(url).toContain("destination=");
    expect(url).not.toContain("origin=");
  });
});
