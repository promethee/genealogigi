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

/** GreatGran -> Gran -> Mum -> Me, plus Dad (adoptive) as a second parent of Me. */
async function buildFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of ["Me", "Mum", "Dad", "Gran", "GreatGran"]) await addPerson(page, name);
  await parentOf(page, "Mum", "Me");
  await parentOf(page, "Dad", "Me", "adoptive");
  await parentOf(page, "Gran", "Mum");
  await parentOf(page, "GreatGran", "Gran");
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("fan");
}

test("draws the root and one wedge per ancestor, limited by generations", async ({ page }) => {
  await buildFamily(page);
  await expect(page.getByTestId("fan-svg")).toBeVisible();
  await expect(page.getByTestId("tree-svg")).toHaveCount(0);
  await expect(page.getByTestId("fan-root")).toContainText("Me");
  await expect(page.getByTestId("fan-wedge")).toHaveCount(4); // Mum, Dad, Gran, GreatGran
  await page.getByTestId("tree-generations").selectOption("2");
  await expect(page.getByTestId("fan-wedge")).toHaveCount(3);
  await expect(page.getByTestId("fan-wedge").filter({ hasText: "GreatGran" })).toHaveCount(0);
});

test("adoptive parent has a dashed outline", async ({ page }) => {
  await buildFamily(page);
  await expect(page.locator('[data-testid="fan-wedge"][data-dashed="true"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="fan-wedge"][data-dashed="true"]')).toContainText("Dad");
});

test("clicking a wedge re-roots and stays in fan mode", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("fan-wedge").filter({ hasText: "Mum" }).click();
  await expect(page.getByTestId("fan-root")).toContainText("Mum");
  await expect(page.getByTestId("tree-direction")).toHaveValue("fan");
  await expect(page.getByTestId("fan-wedge")).toHaveCount(2); // Gran, GreatGran
});

test("a root without parents shows only the circle", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-root").selectOption({ label: "GreatGran" });
  await expect(page.getByTestId("fan-wedge")).toHaveCount(0);
  await expect(page.getByTestId("fan-root")).toContainText("GreatGran");
});
