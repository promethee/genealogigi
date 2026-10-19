import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/tree.json",
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

async function addPerson(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function parentOf(page: Page, parent: string, child: string, nature?: string) {
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: parent });
  await page.getByTestId("rel-second").selectOption({ label: child });
  // The form remembers the last nature, so always set it explicitly.
  await page.getByTestId("rel-nature").selectOption(nature ?? "biological-confirmed");
  await page.getByTestId("rel-add").click();
}

/** Me <- Mum <- Gran <- Greatgran, plus Dad (adoptive) as a second parent of Me. */
async function buildFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of ["Me", "Mum", "Dad", "Gran", "Greatgran"]) await addPerson(page, name);
  await parentOf(page, "Mum", "Me");
  await parentOf(page, "Dad", "Me", "adoptive");
  await parentOf(page, "Gran", "Mum");
  await parentOf(page, "Greatgran", "Gran");
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("hourglass");
}

const chips = (page: Page) => page.getByTestId("focus-chip").allTextContents();

test("the selector says Focused person, and all generations are drawn by default", async ({
  page,
}) => {
  await buildFamily(page);
  await expect(page.getByText("Focused person")).toBeVisible();
  await expect(page.getByTestId("tree-generations")).toHaveValue("99");
  await page.getByTestId("tree-root").selectOption({ label: "Me" });
  await expect(page.getByTestId("tree-node")).toHaveCount(5); // Me, Mum, Dad, Gran, Greatgran
});

test("the panel counts ancestors and descendants of the focused person", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-root").selectOption({ label: "Me" });
  expect(await chips(page)).toEqual(["2 parents", "1 grandparent", "1 great-grandparent"]);

  await page.getByTestId("tree-root").selectOption({ label: "Greatgran" });
  expect(await chips(page)).toEqual(["1 child", "1 grandchild", "1 great-grandchild"]);

  await page.getByTestId("tree-root").selectOption({ label: "Dad" });
  expect(await chips(page)).toEqual(["1 child"]);
});

test("a person with no relatives says so, and French is used", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Solo");
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await expect(page.getByTestId("focus-stats")).toContainText("No known relatives yet.");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("focus-stats")).toContainText("Aucun proche connu");
  await expect(page.getByText("Personne centrale")).toBeVisible();
});

test("the Generations choice can still limit the chart", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-root").selectOption({ label: "Me" });
  await page.getByTestId("tree-generations").selectOption("2");
  await expect(page.getByTestId("tree-node")).toHaveCount(4); // Me, Mum, Dad, Gran: 2 generations above the focus
});
