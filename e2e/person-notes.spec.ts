import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/notes.gigi",
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

async function addAda(page: Page, notes?: string): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("last-name").fill("Byron");
  if (notes !== undefined) await page.getByTestId("notes").fill(notes);
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
}

test("a note typed in the form shows on the card with its line breaks", async ({ page }) => {
  await addAda(page, "Ran a bakery.\nLoved the sea.");
  await page.getByTestId("view-person").click();
  const notes = page.getByTestId("detail-notes");
  await expect(notes).toContainText("Ran a bakery.");
  await expect(notes).toContainText("Loved the sea.");
  await expect(notes.locator("p")).toHaveCSS("white-space", "pre-wrap");
});

test("no note, no Notes section; editing keeps and changes the note", async ({ page }) => {
  await addAda(page);
  await page.getByTestId("view-person").click();
  await expect(page.getByTestId("detail-notes")).toHaveCount(0);

  await page.getByTestId("detail-edit").click();
  await page.getByTestId("notes").fill("First memory");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("detail-notes")).toContainText("First memory");

  await page.getByTestId("detail-edit").click();
  await expect(page.getByTestId("notes")).toHaveValue("First memory");
  await page.getByTestId("notes").fill("");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("detail-notes")).toHaveCount(0);
});

test("the note is saved in the file and survives a restart", async ({ page }) => {
  await addAda(page, "Born during a storm");
  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/notes.gigi"));
  expect(JSON.parse(file ?? "null").people[0].notes).toBe("Born during a storm");
  await page.reload();
  await page.getByTestId("resume").click();
  await page.getByTestId("view-person").click();
  await expect(page.getByTestId("detail-notes")).toContainText("Born during a storm");
});

test("search finds a word that is only in a note, and French labels are used", async ({ page }) => {
  await addAda(page, "Worked at the lighthouse");
  await page.getByTestId("search").fill("lighthouse");
  await expect(page.getByTestId("search-result")).toHaveCount(1);
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("view-person").click();
  await expect(page.getByTestId("detail-notes")).toContainText("Notes");
});
