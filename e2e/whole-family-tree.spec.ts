import { expect, test, type Page } from "@playwright/test";

// The whole-family tree: every person once, partners joined by a coloured segment.
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
  for (const n of ["Gran", "Mum", "Dad", "Me", "Pat", "Solo"]) await add(page, n);
  const parents = async (child: string, a: string, b: string) => {
    await page.getByTestId("rel-kind").selectOption("parent");
    await page.getByTestId("rel-second").selectOption({ label: child });
    await page.getByTestId("rel-first").selectOption({ label: a });
    await page.getByTestId("rel-parent-b").selectOption({ label: b });
    await page.getByTestId("rel-add").click();
  };
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Gran" });
  await page.getByTestId("rel-second").selectOption({ label: "Mum" });
  await page.getByTestId("rel-add").click();
  await parents("Me", "Mum", "Dad");
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Me" });
  await page.getByTestId("rel-second").selectOption({ label: "Pat" });
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(4);
  await page.getByTestId("tab-tree").click();
}

test("Everyone shows every person exactly once, linked, with the controls it does not need hidden", async ({
  page,
}) => {
  await family(page);
  await page.getByTestId("tree-direction").selectOption("everyone");
  await expect(page.getByTestId("tree-node")).toHaveCount(6);
  await expect(page.getByTestId("tree-edge")).toHaveCount(3);
  await expect(page.getByTestId("tree-root")).toHaveCount(0);
  await expect(page.getByTestId("tree-generations")).toHaveCount(0);
  await expect(page.getByTestId("tree-siblings")).toHaveCount(0);
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toHaveCount(0);
});

test("Everyone joins partners with a segment in the partner colour", async ({ page }) => {
  await family(page);
  await page.getByTestId("tree-direction").selectOption("everyone");
  const partner = page.getByTestId("tree-partner");
  await expect(partner).toHaveCount(1);
  const stroke = (loc: import("@playwright/test").Locator) =>
    loc.evaluate((el) => getComputedStyle(el).stroke);
  expect(await stroke(partner)).not.toBe(await stroke(page.getByTestId("tree-edge").first()));
  await expect(page.getByTestId("tree-legend")).toContainText("partners");
});

test("clicking a box in Everyone opens that person's card", async ({ page }) => {
  await family(page);
  await page.getByTestId("tree-direction").selectOption("everyone");
  await page.getByTestId("tree-node").filter({ hasText: "Solo" }).click();
  await expect(page.getByTestId("detail-name")).toContainText("Solo");
});

test("switching back to a focused view restores the controls", async ({ page }) => {
  await family(page);
  await page.getByTestId("tree-direction").selectOption("everyone");
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await expect(page.getByTestId("tree-root")).toBeVisible();
  await expect(page.getByTestId("tree-generations")).toBeVisible();
});

test("the Tree tab opens on the whole family by default", async ({ page }) => {
  await family(page);
  await expect(page.getByTestId("tree-direction")).toHaveValue("everyone");
  await expect(page.getByTestId("tree-node")).toHaveCount(6);
});
