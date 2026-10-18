import { expect, test } from "@playwright/test";

// Runs the real UI + store against a fake PlatformAPI (in-memory "disk" kept in
// localStorage so it survives reloads). Real dialogs: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => read("fake:openResult"),
      saveFileDialog: async () => "C:/families/new.json",
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

test("fresh start shows welcome with Resume disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("open")).toBeVisible();
  await expect(page.getByTestId("create")).toBeVisible();
  await expect(page.getByTestId("resume")).toBeDisabled();
});

test("create new, then resume after restart", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("loaded-summary")).toContainText("0 people");

  await page.reload();
  await expect(page.getByTestId("resume")).toBeEnabled();
  await expect(page.getByTestId("resume")).toContainText("new.json");
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("loaded-path")).toHaveText("C:/families/new.json");
});

test("opening a corrupt file shows an error and stays on welcome", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("fake:openResult", "C:/bad.json");
    localStorage.setItem("fake:file:C:/bad.json", "{not json");
  });
  await page.goto("/");
  await page.getByTestId("open").click();
  await expect(page.getByTestId("error")).toHaveText("The file is not valid JSON.");
  await expect(page.getByTestId("open")).toBeVisible();
});
