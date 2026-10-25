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
  await expect(dialog.getByLabel("Difficulty Classes", { exact: true })).toBeVisible();
});

test("a new sheet exposes its ruleset revision", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New sheet", exact: true }).first().click();
  const analysis = page.getByRole("button", { name: "Analysis", exact: true });
  await expect(analysis).toBeVisible();
  await analysis.click();
  await expect(page.getByText(/M&M4e Origin playtest · previews 1–9/)).toBeVisible();
});

test("share action labels remain intact at responsive widths", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New sheet", exact: true }).first().click();

  const share = page.locator(".workspace-actions > button.button");
  await expect(share).toHaveCount(1);

  for (const width of [700, 768, 960, 1180, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(share).toBeVisible();

    const metrics = await share.evaluate((button) => {
      const style = getComputedStyle(button);
      return {
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
        scrollWidth: button.scrollWidth,
        clientWidth: button.clientWidth,
      };
    });

    expect(metrics.whiteSpace, `white-space at ${width}px`).toBe("nowrap");
    expect(metrics.wordBreak, `word-break at ${width}px`).toBe("normal");
    expect(metrics.overflowWrap, `overflow-wrap at ${width}px`).toBe("normal");
    expect(metrics.scrollWidth, `share label overflows at ${width}px`).toBeLessThanOrEqual(metrics.clientWidth + 1);
  }
});
