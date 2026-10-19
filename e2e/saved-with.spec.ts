import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version as string;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/stamp.gigi",
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

const savedFile = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("fake:file:C:/families/stamp.gigi") ?? "{}"));

test("the family file records the app version that wrote it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  expect((await savedFile(page)).savedWith).toBe(version);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  const file = await savedFile(page);
  expect(file.savedWith).toBe(version);
  expect(file.schemaVersion).toBe(1); // the format version is a separate thing
});

test("an older stamp is replaced by the next save", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.evaluate(() => {
    const key = "fake:file:C:/families/stamp.gigi";
    const file = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({ ...file, savedWith: "0.0.1" }));
  });
  await page.reload();
  await page.getByTestId("resume").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  expect((await savedFile(page)).savedWith).toBe(version);
});
