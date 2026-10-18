import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/people.json",
      confirm: async () => read("fake:confirm") !== "no",
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

async function createFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();
}

async function addPerson(page: Page, first: string, last: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("last-name").fill(last);
  await page.getByTestId("submit-person").click();
}

test("empty family shows an invitation to add a person", async ({ page }) => {
  await createFamily(page);
  await expect(page.getByTestId("empty-state")).toContainText("Add the first person");
});

test("adds people with both names or only one", async ({ page }) => {
  await createFamily(page);
  await addPerson(page, "Ada", "Lovelace");
  await addPerson(page, "", "Byron");
  await expect(page.getByTestId("person-name")).toHaveText(["Ada Lovelace", "Byron"]);
  await expect(page.getByTestId("loaded-summary")).toContainText("2 people");
});

test("rejects a person with no name", async ({ page }) => {
  await createFamily(page);
  await addPerson(page, " ", "");
  await expect(page.getByTestId("error")).toHaveText("At least one name is required.");
  await expect(page.getByTestId("person-row")).toHaveCount(0);
});

test("edits a person's name", async ({ page }) => {
  await createFamily(page);
  await addPerson(page, "Ada", "Byron");
  await page.getByTestId("edit-person").click();
  await page.getByTestId("last-name").fill("Lovelace");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name")).toHaveText(["Ada Lovelace"]);
});

test("deleting asks for confirmation and respects cancel", async ({ page }) => {
  await createFamily(page);
  await addPerson(page, "Ada", "");

  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("delete-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);

  await page.evaluate(() => localStorage.setItem("fake:confirm", "yes"));
  await page.getByTestId("delete-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(0);
});

test("people survive a restart", async ({ page }) => {
  await createFamily(page);
  await addPerson(page, "Ada", "Lovelace");
  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("person-name")).toHaveText(["Ada Lovelace"]);
});
