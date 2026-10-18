import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
// The first save dialog (Create new) returns the original file; later ones return
// whatever the test put in "fake:copyPath" (null = cancel).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    let dialogCalls = 0;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => {
        dialogCalls += 1;
        return dialogCalls === 1 ? "C:/families/orig.json" : read("fake:copyPath");
      },
      confirm: async () => true,
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

async function familyWithAda(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
}

const setCopyPath = (page: Page, path: string) =>
  page.evaluate((p) => localStorage.setItem("fake:copyPath", p), path);

test("saves a copy with the same people and keeps the original open", async ({ page }) => {
  await familyWithAda(page);
  await setCopyPath(page, "C:/backup/copy.json");
  await page.getByTestId("save-copy").click();

  await expect(page.getByTestId("notice")).toHaveText("Copy saved to C:/backup/copy.json");
  await expect(page.getByTestId("loaded-path")).toHaveText("C:/families/orig.json");

  const copy = await page.evaluate(() => localStorage.getItem("fake:file:C:/backup/copy.json"));
  expect(JSON.parse(copy ?? "null").people).toHaveLength(1);
  const last = await page.evaluate(() => localStorage.getItem("fake:lastPath"));
  expect(last).toBe("C:/families/orig.json");
});

test("cancelling the dialog shows nothing and writes nothing", async ({ page }) => {
  await familyWithAda(page);
  await page.evaluate(() => localStorage.removeItem("fake:copyPath"));
  await page.getByTestId("save-copy").click();
  await expect(page.getByTestId("notice")).toHaveCount(0);
  await expect(page.getByTestId("error")).toHaveCount(0);
});

test("refuses to copy onto the open file", async ({ page }) => {
  await familyWithAda(page);
  await setCopyPath(page, "c:/FAMILIES/orig.json");
  await page.getByTestId("save-copy").click();
  await expect(page.getByTestId("error")).toContainText("different file");
  await expect(page.getByTestId("notice")).toHaveCount(0);
});

test("the copy-saved message disappears after another change", async ({ page }) => {
  await familyWithAda(page);
  await setCopyPath(page, "C:/backup/copy.json");
  await page.getByTestId("save-copy").click();
  await expect(page.getByTestId("notice")).toBeVisible();

  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(2);
  await expect(page.getByTestId("notice")).toHaveCount(0);
});
