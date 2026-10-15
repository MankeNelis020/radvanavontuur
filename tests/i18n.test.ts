import assert from "node:assert/strict";
import test from "node:test";
import { en, nl } from "../lib/i18n/dictionary";

const allowedIdentical = new Set([
  "Wondaro",
  "Museum",
  "Menu",
  "Account",
  "Water",
  "English",
  "Nederlands",
  "{value}",
  "{value} km",
]);

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return ["array", value.length, ...value.map(shape)];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    );
  }
  return typeof value;
}

function strings(value: unknown, path = ""): Array<{ path: string; value: string }> {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  }
  return [];
}

test("English and Dutch dictionaries have the same shape", () => {
  assert.deepEqual(shape(nl), shape(en));
});

test("localized copy stays in one language", () => {
  const english = new Map(strings(en).map((item) => [item.path, item.value]));
  for (const item of strings(nl)) {
    const counterpart = english.get(item.path);
    if (counterpart === item.value && !allowedIdentical.has(item.value)) {
      assert.fail(`${item.path} is identical in Dutch and English: ${item.value}`);
    }
    assert.doesNotMatch(item.value, /\b(the|and|your|with|spin|adventure|where|next|wheel)\b/i, item.path);
  }
});

test("required brand lines are exact", () => {
  assert.equal(en.tagline, "Your next adventure starts with a spin.");
  assert.equal(en.home.title, "Where to next?");
  assert.equal(en.spin.spin, "Spin the wheel");
  assert.equal(en.results.title, "Discover your adventure");
  assert.equal(en.home.closeTitle, "Make today an adventure");
  assert.equal(nl.tagline, "Je volgende avontuur begint met een draai.");
  assert.equal(nl.home.title, "Waar gaan we heen?");
  assert.equal(nl.spin.spin, "Draai het rad");
  assert.equal(nl.results.title, "Ontdek je avontuur");
  assert.equal(nl.home.closeTitle, "Maak van vandaag een avontuur");
});

test("copy does not use gambling language or the previous name", () => {
  const banned = /jackpot|casino|prize|lucky|winner|gamble|slot machine|betting|prijs|gokken|rad van avontuur/i;
  for (const item of [...strings(en), ...strings(nl)]) {
    assert.doesNotMatch(item.value, banned, item.path);
  }
});
