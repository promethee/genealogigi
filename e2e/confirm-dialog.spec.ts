import { expect, test, type Page } from "@playwright/test";

// The fake shell delegates confirm() to the app's real in-app dialog (dev seam).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown> & {
      __GENEALOGIGI_CONFIRM__: (m: string) => Promise<boolean>;
    };
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/names.json",
      confirm: (message: string) => w.__GENEALOGIGI_CONFIRM__(message),
      data: {
        exists: async (p: string) => read(`fake:file:${p}`) !== null,
        load: async (p: string) => JSON.parse(read(`fake:file:${p}`) ?? "null"),
        save: async (p: string, d: unknown) =>
          localStorage.setItem(`fake:file:${p}`, JSON.stringify(d)),
      },
      settings: {
        getLastFilePath: async () => read("fake:lastPath"),
        setLastFilePath: async (p: string | null) =>
          p === null
            ? localStorage.removeItem("fake:lastPath")
            : localStorage.setItem("fake:lastPath", p),
      },
      exit: async () => {},
    };
  });
});

async function askToDelete(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("view-person").click();
  await page.getByTestId("detail-delete").click();
}

test("deleting asks in an in-app dialog with the question, focused on Cancel", async ({ page }) => {
  await askToDelete(page);
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await expect(page.getByTestId("confirm-message")).toContainText("Ada");
  await expect(page.getByTestId("confirm-cancel")).toBeFocused();
  await expect(page.getByTestId("confirm-dialog")).toHaveCSS("border-top-width", "1px");
});

test("Cancel, Escape and the backdrop keep the person; Confirm deletes", async ({ page }) => {
  await askToDelete(page);
  await page.getByTestId("confirm-cancel").click();
  await expect(page.getByTestId("confirm-dialog")).toHaveCount(0);
  await expect(page.getByTestId("detail-name")).toBeVisible();

  await page.getByTestId("detail-delete").click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("confirm-dialog")).toHaveCount(0);

  await page.getByTestId("detail-delete").click();
  await page.getByTestId("confirm-backdrop").click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId("confirm-dialog")).toHaveCount(0);
  await expect(page.getByTestId("detail-name")).toBeVisible();

  await page.getByTestId("detail-delete").click();
  await page.getByTestId("confirm-ok").click();
  await expect(page.getByTestId("person-row")).toHaveCount(0);
});

test("the dialog follows the language and the dark theme", async ({ page }) => {
  await askToDelete(page);
  await page.getByTestId("confirm-cancel").click();
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("theme-toggle").click();
  await page.getByTestId("detail-delete").click();
  await expect(page.getByTestId("confirm-ok")).toHaveText("Confirmer");
  await expect(page.getByTestId("confirm-cancel")).toHaveText("Annuler");
  const bg = await page
    .getByTestId("confirm-dialog")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgb(255, 255, 255)");
});
