import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { selectIndex } from "../lib/selection";
import { parseSpin } from "../lib/session";
import { rotationForSegment } from "../lib/wheel";

test("selection is uniform, bounded, and deterministic", () => {
  assert.equal(selectIndex(6, () => 0), 0);
  assert.equal(selectIndex(6, () => 0.999999), 5);
  assert.throws(() => selectIndex(0, () => 0));
  assert.throws(() => selectIndex(4, () => 1));

  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6000; i += 1) {
    const index = selectIndex(6);
    assert.ok(index >= 0 && index < 6);
    counts[index] += 1;
  }
  for (const count of counts) assert.ok(count > 700);
});

test("selection source accepts no weights or partnerships", () => {
  const source = readFileSync(new URL("../lib/selection.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(source, /export function selectIndex\(count: number, random: \(\) => number/);
  assert.doesNotMatch(source, /partner|sponsor|weight|preference/i);
});

test("the wheel asks only for an independent index", () => {
  const source = readFileSync(new URL("../components/spin/SpinExperience.tsx", import.meta.url), "utf8");
  assert.match(source, /selectIndex\(segments\.length\)/);
  assert.doesNotMatch(source, /selectIndex\([^)]*(preference|distance|partner)/);
});

test("rotation lands the chosen segment under the pointer", () => {
  const first = rotationForSegment(0, 0);
  assert.equal(first % 360, 0);
  assert.ok(first >= 360 * 5);

  const coast = rotationForSegment(1, 0);
  assert.equal(coast % 360, 300);
  const again = rotationForSegment(1, coast);
  assert.ok(again > coast);
  assert.equal(again % 360, 300);
});

test("saved spins reject weighted or incomplete payloads", () => {
  assert.equal(parseSpin("{"), null);
  assert.equal(parseSpin(JSON.stringify({ segment: "forest" })), null);
  const record = parseSpin(
    JSON.stringify({
      segment: "coast",
      mode: "quick",
      distanceKm: 12,
      ages: [8],
      preferences: [],
    }),
  );
  assert.deepEqual(record, {
    segment: "coast",
    mode: "quick",
    distanceKm: 12,
    ages: [8],
    preferences: [],
  });
});
