import { expect, test, type Page } from "@playwright/test";

// The search box also narrows the relationship lines to the people it finds.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown> & {
      __GENEALOGIGI_CONFIRM__: (m: string, o?: unknown) => Promise<boolean>;
      __GENEALOGIGI_PROMPT__: (o: unknown) => Promise<string | null>;
    };
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/polish.gigi",
      confirm: (m: string, o?: unknown) => w.__GENEALOGIGI_CONFIRM__(m, o),
      promptText: async () => "Polish family",
      data: {
        exists: async (p: string) => read(`fake:file:${p}`) !== null,
        load: async (p: string) => JSON.parse(read(`fake:file:${p}`) ?? "null"),
        save: async (p: string, d: unknown) =>
          localStorage.setItem(`fake:file:${p}`, JSON.stringify(d)),
        readRaw: async (p: string) => read(`fake:file:${p}`) ?? "",
        writeRaw: async (p: string, text: string) => localStorage.setItem(`fake:file:${p}`, text),
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

async function add(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function family(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const n of ["Ada", "Byron", "Cleo", "Dan"]) await add(page, n);
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Cleo" });
  await page.getByTestId("rel-second").selectOption({ label: "Dan" });
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
  await page.getByTestId("tab-list").click();
}

test("searching keeps only the relationship lines of the people found", async ({ page }) => {
  await family(page);
  await page.getByTestId("search").fill("ada");
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);
  await expect(page.getByTestId("relationship-text")).toHaveText(["Ada is parent of Byron"]);
  await page.getByTestId("search").fill("dan");
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Cleo and Dan are partners (ongoing)",
  ]);
});

test("a search that finds nobody says so; clearing it brings every line back", async ({ page }) => {
  await family(page);
  await page.getByTestId("search").fill("zzz");
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
  await expect(page.getByTestId("relationships-empty")).toHaveText("Nobody found.");
  await page.getByTestId("search").fill("");
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
});

test("filtering the lines never narrows the choices of the relationship form", async ({ page }) => {
  await family(page);
  await page.getByTestId("search").fill("ada");
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);
  // Choose…, Ada, Byron, Cleo, Dan: the form still offers everybody.
  await expect(page.getByTestId("rel-first").locator("option")).toHaveCount(5);
});
