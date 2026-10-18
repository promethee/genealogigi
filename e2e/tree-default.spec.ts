import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/relations.json",
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

async function addPerson(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

test("opens on the tree when relationships exist, on the people list otherwise", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("empty-state")).toBeVisible(); // new family: people list
  await addPerson(page, "Ada");
  await addPerson(page, "Byron");
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-add").click();
  // Adding the first relationship does not switch tabs.
  await expect(page.getByTestId("relationships-section")).toBeVisible();

  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("tree-section")).toBeVisible();
  await expect(page.getByTestId("relationships-section")).toHaveCount(0);
});

test("a family without relationships resumes on the people list", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Ada");
  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("add-person")).toBeVisible();
  await expect(page.getByTestId("tree-section")).toHaveCount(0);
});
