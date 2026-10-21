import { expect, test } from "@playwright/test";

test("filter listings by locality and open the detail page with the assistant", async ({ page }) => {
  await page.goto("/listings");
  await page.getByLabel("Locality").selectOption({ label: "Kokapet" });
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/locality=kokapet/);

  await page.getByRole("link", { name: /in Kokapet/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kokapet");
  await expect(page.getByRole("complementary", { name: "Property assistant" })).toBeVisible();
});
