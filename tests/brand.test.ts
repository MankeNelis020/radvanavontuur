import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "node_modules" || name === ".next") return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

test("provisional logo files are marked for replacement", () => {
  for (const name of ["icon.svg", "logo-horizontal.svg", "logo-compact.svg", "logo-mono.svg"]) {
    const svg = readFileSync(new URL(`../public/brand/${name}`, import.meta.url), "utf8");
    assert.match(svg, /PROVISIONAL/);
    assert.match(svg, /not the approved final vector logo/);
    assert.match(svg, /Wondaro/);
  }
});

test("interface files do not hardcode palette hex colors", () => {
  const files = walk(new URL(".", root).pathname).filter((path) => {
    if (!/\.(ts|tsx)$/.test(path)) return false;
    if (path.endsWith("app/manifest.ts")) return false;
    if (path.includes(`${join("tests")}`)) return false;
    return true;
  });
  const offenders: string[] = [];
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    if (/#[0-9A-Fa-f]{8}(?![0-9A-Fa-f])|#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/.test(text)) {
      offenders.push(path);
    }
  }
  assert.deepEqual(offenders, []);
});
