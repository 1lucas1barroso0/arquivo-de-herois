import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("arquivo-de-herois:onboarding:v1", "done");
    localStorage.setItem("arquivo-de-herois:idioma:v1", "en");
  });
});

test("English references remain consistently translated", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "References", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Rules, options, and scales" });
  await expect(dialog).toContainText("searchable topics");
  await dialog.getByRole("button", { name: "Abilities" }).click();
  await expect(dialog).toContainText("Human average");
  await dialog.getByRole("button", { name: "Skills" }).click();
  await expect(dialog).toContainText("Difficulty Classes");
});

test("a new sheet exposes its ruleset revision", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New sheet", exact: true }).first().click();
  await expect(page.getByText("Editing mode", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Analysis", exact: true }).click();
  await expect(page.getByText(/M&M4e Origin playtest · previews 1–9/)).toBeVisible();
});
