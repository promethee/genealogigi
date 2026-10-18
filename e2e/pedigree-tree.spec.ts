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

/** Me <- Mum <- Gran <- GreatGran, plus Dad (adoptive) as a second parent of Me. */
async function buildFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of ["Me", "Mum", "Dad", "Gran", "GreatGran"]) await addPerson(page, name);
  await parentOf(page, "Mum", "Me");
  await parentOf(page, "Dad", "Me", "adoptive");
  await parentOf(page, "Gran", "Mum");
  await parentOf(page, "GreatGran", "Gran");
  await page.getByTestId("tab-tree").click();
}

test("tree tab explains when there is nobody to show, and tabs switch back", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("tab-tree").click();
  await expect(page.getByTestId("tree-empty")).toBeVisible();
  await page.getByTestId("tab-list").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("shows the first person as root with ancestors, limited by generations", async ({ page }) => {
  await buildFamily(page);
  await expect(page.getByTestId("tree-root")).toHaveValue(/.+/);
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Me");
  // Default 4 ancestor generations: Me, Mum, Dad, Gran, GreatGran.
  await expect(page.getByTestId("tree-node")).toHaveCount(5);

  await page.getByTestId("tree-generations").selectOption("2");
  await expect(page.getByTestId("tree-node")).toHaveCount(4);
  await expect(page.getByTestId("tree-node").filter({ hasText: "GreatGran" })).toHaveCount(0);
});

test("draws adoptive links dashed and confirmed links solid, with a legend", async ({ page }) => {
  await buildFamily(page);
  await expect(page.getByTestId("tree-legend")).toBeVisible();
  await expect(page.locator('[data-testid="tree-edge"][data-dashed="true"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="tree-edge"][data-dashed="false"]')).toHaveCount(3);
});

test("clicking a person re-roots the chart", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-node").filter({ hasText: "Mum" }).dblclick();
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Mum");
  await expect(page.getByTestId("tree-node")).toHaveCount(4); // hourglass: Mum, Gran, GreatGran above, Me below
});

test("the root can be chosen from the list", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-root").selectOption({ label: "Gran" });
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Gran");
  await expect(page.getByTestId("tree-node")).toHaveCount(4); // GreatGran above; Mum and Me below
});
