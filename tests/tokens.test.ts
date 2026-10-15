import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("brand tokens use the Wondaro palette", () => {
  const required = [
    "--brand-primary: #103D32;",
    "--brand-primary-dark: #082C26;",
    "--brand-accent: #E8AD42;",
    "--brand-background: #FFF8EB;",
    "--brand-surface: #F1E5CE;",
    "--brand-sage: #91AD91;",
    "--brand-terracotta: #C97852;",
    "--brand-text: #21352F;",
    "--radius-card: 24px;",
    "--radius-button: 999px;",
    "--radius-input: 14px;",
  ];
  for (const token of required) {
    assert.ok(css.includes(token), token);
  }
});

test("tokens are mapped into the Tailwind theme", () => {
  for (const name of [
    "--color-brand-primary: var(--brand-primary);",
    "--color-brand-accent: var(--brand-accent);",
    "--color-brand-background: var(--brand-background);",
    "--radius-card: var(--radius-card);",
    "--radius-button: var(--radius-button);",
    "--font-heading:",
    "--font-body:",
  ]) {
    assert.ok(css.includes(name), name);
  }
});

test("reduced motion is supported in global CSS", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
