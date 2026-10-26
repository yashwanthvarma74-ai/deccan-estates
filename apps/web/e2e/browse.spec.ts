import { expect, test } from "@playwright/test";

test("tap a property type, change the area from the search strip, and open a listing with the assistant", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Plots/ }).click();
  await expect(page).toHaveURL(/type=PLOT/);

  // The strip stays at the top of the page: changing the area applies immediately.
  await page.getByLabel("Area").selectOption({ label: "Kokapet" });
  await expect(page).toHaveURL(/locality=kokapet/);
  await expect(page.getByRole("region", { name: "Map of matching listings" })).toBeVisible();

  await page.getByRole("link", { name: /in Kokapet/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kokapet");
  await expect(page.getByRole("complementary", { name: "Property assistant" })).toBeVisible();
  // ...and the strip is still there on the detail page.
  await expect(page.getByRole("search", { name: "Change your search" })).toBeVisible();
});
