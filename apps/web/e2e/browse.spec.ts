import { expect, test } from "@playwright/test";

test("filter by locality, see the map, and open a listing with the assistant", async ({ page }) => {
  await page.goto("/listings");
  await page.getByLabel("Search by locality, project or keyword").fill("Kokapet");
  await page.getByLabel("Search by locality, project or keyword").press("Enter");
  await expect(page).toHaveURL(/locality=kokapet/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Homes for Sale in Kokapet");
  await expect(page.getByRole("region", { name: "Map of matching listings" })).toBeVisible();

  await page.getByRole("link", { name: /in Kokapet/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kokapet");
  await expect(page.getByRole("complementary", { name: "Property assistant" })).toBeVisible();
});
