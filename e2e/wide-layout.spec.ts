import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/wide.gigi",
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

const box = async (page: import("@playwright/test").Page, id: string) =>
  (await page.getByTestId(id).first().boundingBox())!;

test("on a wide window the people list and the relationships sit side by side", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1900, height: 1000 });
  await page.goto("/");
  await page.getByTestId("create").click();
  const list = await box(page, "empty-state");
  const rel = await box(page, "relationships-section");
  expect(rel.x).toBeGreaterThan(list.x + list.width - 1);
  // The content uses most of the width instead of a narrow centred column.
  expect(rel.x + rel.width - list.x).toBeGreaterThan(1500);
});

test("on a narrow window they stack", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.goto("/");
  await page.getByTestId("create").click();
  const list = await box(page, "empty-state");
  const rel = await box(page, "relationships-section");
  expect(rel.y).toBeGreaterThan(list.y + list.height - 1);
});
