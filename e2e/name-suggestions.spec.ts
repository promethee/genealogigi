import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/names.json",
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

async function person(page: Page, first: string, last: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill(first);
  await page.getByTestId("last-name").first().fill(last);
  await page.getByTestId("submit-person").click();
}

const suggestions = (page: Page) =>
  page
    .locator("datalist#last-name-suggestions option")
    .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));

test("last names already saved are suggested, most frequent first", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await person(page, "Ada", "Martin");
  await person(page, "Byron", "Dubois");
  await person(page, "Cleo", "Dubois");

  await page.getByTestId("add-person").click();
  const input = page.getByTestId("last-name").first();
  await expect(input).toHaveAttribute("list", "last-name-suggestions");
  expect(await suggestions(page)).toEqual(["Dubois", "Martin"]);
  // First names have no suggestions.
  await expect(page.getByTestId("first-name").first()).not.toHaveAttribute("list", /.+/);
});

test("the married-name field gets the suggestions too, and any other value is accepted", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await person(page, "Ada", "Martin");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Marie");
  await page.getByTestId("last-name").first().fill("Moreau");
  await page.getByTestId("add-last-name").click();
  await expect(page.getByTestId("last-name").nth(1)).toHaveAttribute(
    "list",
    "last-name-suggestions",
  );
  await page.getByTestId("last-name").nth(1).fill("Brand-new");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name").last()).toHaveText("Marie Brand-New (née Moreau)");
});

test("no suggestions list when nothing is saved yet", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await expect(page.locator("datalist")).toHaveCount(0);
  await page.getByTestId("last-name").first().fill("Anything");
  await expect(page.getByTestId("last-name").first()).toHaveValue("Anything");
});
