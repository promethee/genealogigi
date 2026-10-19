import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// The project page (docs/index.html) opens in the visitor's language: French or English.
const page_url = pathToFileURL(resolve("docs/index.html")).href;

test.describe("French browser", () => {
  test.use({ locale: "fr-FR" });
  test("the page is in French without any click", async ({ page }) => {
    await page.goto(page_url);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1")).toContainText("L’histoire de votre famille");
    await expect(page.locator(".cta .btn").first()).toContainText("Télécharger pour Windows");
    await expect(page).toHaveTitle(/l’histoire de votre famille/);
    expect(await page.locator("#meta-desc").getAttribute("content")).toContain("gratuite");
    const tree = page.locator('img[data-src-fr*="tree-light"]');
    expect(await tree.getAttribute("alt")).toContain("L’arbre");
    expect(await tree.getAttribute("src")).toBe("screenshots/tree-light-fr.jpg"); // French screenshots too
  });
});

test.describe("English browser", () => {
  test.use({ locale: "en-GB" });
  test("the page stays in English", async ({ page }) => {
    await page.goto(page_url);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText("Your family's story");
    await expect(page.locator('img[data-src-fr*="tree-light"]')).toHaveAttribute(
      "src",
      "screenshots/tree-light.jpg",
    );
  });
});

test.describe("another language", () => {
  test.use({ locale: "de-DE" });
  test("falls back to English", async ({ page }) => {
    await page.goto(page_url);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText("Your family's story");
  });
});

test.describe("choosing by hand", () => {
  test.use({ locale: "fr-FR" });
  test("?lang=en wins over the browser, and the footer links switch and are remembered", async ({
    page,
  }) => {
    await page.goto(`${page_url}?lang=en`);
    await expect(page.locator("h1")).toContainText("Your family's story");
    await page.locator('[data-lang="fr"]').click();
    await expect(page.locator("h1")).toContainText("L’histoire de votre famille");
    await expect(page.locator('[data-lang="fr"]')).toHaveAttribute("aria-current", "true");
    await page.reload(); // the last choice is kept
    await expect(page.locator("h1")).toContainText("L’histoire de votre famille");
    await page.locator('[data-lang="en"]').click();
    await expect(page.locator("h1")).toContainText("Your family's story");
    await expect(page.locator(".pill")).toContainText("Free forever");
  });
});
