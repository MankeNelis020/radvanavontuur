import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("rva-consent", "denied");
  });
});

test("snel draaien zonder account tot een kaartlink", async ({ page }) => {
  await page.goto("/snel");
  await page.getByLabel("Plaats of postcode").fill("Utrecht");
  await page.getByRole("button", { name: "Naar het rad" }).click();
  await expect(page.getByRole("button", { name: "Draai het rad" })).toBeVisible();
  await page.getByRole("button", { name: "Draai het rad" }).click();
  await page.getByRole("button", { name: "Dit wordt 'm!" }).click();
  await expect(page.getByRole("link", { name: "Open in Google Maps" })).toBeVisible();
  const href = await page.getByRole("link", { name: "Open in Google Maps" }).getAttribute("href");
  expect(href).toContain("google.com/maps");
  await page.getByRole("button", { name: "Voeg lunch toe" }).click();
  await expect(page.getByRole("status")).toContainText(/Lunch:|Geen lunchpunt/);
  await page.getByRole("button", { name: "Voeg tussenstop toe" }).click();
  await expect(page.getByRole("status")).toContainText(/Tussenstop:|Geen tussenstop|te weinig tijd/);
});

test("uitgebreid draaien en één herkansing", async ({ page }) => {
  await page.goto("/uitgebreid");
  await page.getByLabel("Plaats of postcode").fill("Amsterdam");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Naar het rad" }).click();
  await page.getByRole("button", { name: "Draai het rad" }).click();
  await page.getByRole("button", { name: "Eén keer opnieuw draaien" }).click();
  await page.getByRole("button", { name: "Draai opnieuw" }).click();
  await page.getByRole("button", { name: "Draai het rad" }).click();
  await expect(page.getByRole("button", { name: "Herkansing gebruikt" })).toBeDisabled();
});

test("account is optioneel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Snel draaien" })).toBeVisible();
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByText("Niet verplicht. Met een account bewaar je avonturen, favorieten en reviews.")).toBeVisible();
});
