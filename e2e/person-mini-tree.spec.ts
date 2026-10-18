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

async function add(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function family(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const n of ["Mum", "Dad", "Me", "Pat", "Kid", "Solo"]) await add(page, n);
  const parents = async (child: string, a: string, b: string, nature = "biological-confirmed") => {
    await page.getByTestId("rel-child").selectOption({ label: child });
    await page.getByTestId("rel-parent-a").selectOption({ label: a });
    await page.getByTestId("rel-parent-b").selectOption({ label: b });
    await page.getByTestId("rel-nature").selectOption(nature);
    await page.getByTestId("rel-add").click();
  };
  await parents("Me", "Mum", "Dad");
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Me" });
  await page.getByTestId("rel-second").selectOption({ label: "Kid" });
  await page.getByTestId("rel-nature").selectOption("adoptive");
  await page.getByTestId("rel-add").click();
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Me" });
  await page.getByTestId("rel-second").selectOption({ label: "Pat" });
  await page.getByTestId("rel-add").click();
}

const open = (page: Page, name: string) =>
  page
    .getByTestId("person-name")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();
const node = (page: Page, text: string) =>
  page.getByTestId("mini-node").filter({ hasText: new RegExp(`^${text}`) });

test("the card shows parents above, partner beside, children below", async ({ page }) => {
  await family(page);
  await open(page, "Me");
  await expect(page.getByTestId("mini-tree")).toBeVisible();
  await expect(page.getByTestId("mini-node")).toHaveCount(5); // Mum, Dad, Me, Pat, Kid
  const [mum, dad, me, pat, kid] = await Promise.all(
    ["Mum", "Dad", "Me", "Pat", "Kid"].map(async (n) => (await node(page, n).boundingBox())!),
  );
  expect(mum.y).toBeLessThan(me.y);
  expect(dad.y).toBeCloseTo(mum.y, 0);
  expect(dad.x).toBeGreaterThan(mum.x);
  expect(pat.y).toBeCloseTo(me.y, 0);
  expect(pat.x).toBeGreaterThan(me.x);
  expect(kid.y).toBeGreaterThan(me.y);
  await expect(page.locator('[data-testid="mini-node"][data-role="self"]')).toContainText("Me");
  await expect(page.locator('[data-testid="mini-node"][data-role="self"]')).toHaveCount(1);
});

test("a non-confirmed child link is dashed and noted; confirmed links are solid", async ({
  page,
}) => {
  await family(page);
  await open(page, "Me");
  await expect(page.getByTestId("mini-nature")).toHaveText(["adoptive"]);
  await expect(page.locator('[data-testid="mini-edge"][data-dashed="true"]')).toHaveCount(1);
  // Two solid parent links and the partner line.
  await expect(page.locator('[data-testid="mini-edge"][data-dashed="false"]')).toHaveCount(3);
});

test("clicking a box opens that person's card and redraws the tree around them", async ({
  page,
}) => {
  await family(page);
  await open(page, "Me");
  await node(page, "Kid").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Kid");
  // Kid has one parent (Me): a tree with one box above and Kid highlighted.
  await expect(page.getByTestId("mini-node")).toHaveCount(2);
  await expect(page.locator('[data-testid="mini-node"][data-role="self"]')).toContainText("Kid");
  await node(page, "Me").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Me");
});

test("the card of someone with no family has no small tree", async ({ page }) => {
  await family(page);
  await open(page, "Solo");
  await expect(page.getByTestId("detail-name")).toHaveText("Solo");
  await expect(page.getByTestId("mini-tree")).toHaveCount(0);
});

test("only children: no row above", async ({ page }) => {
  await family(page);
  await open(page, "Mum");
  // Mum has a child (Me): Mum on the first row, Me below; Dad is not shown (not Mum's partner).
  await expect(page.getByTestId("mini-node")).toHaveCount(2);
  const mum = (await node(page, "Mum").boundingBox())!;
  const me = (await node(page, "Me").boundingBox())!;
  expect(me.y).toBeGreaterThan(mum.y);
});

test("French heading, and the tree also shows in the tree tab's card", async ({ page }) => {
  await family(page);
  await page.getByTestId("lang-fr").click();
  await open(page, "Me");
  await expect(page.getByTestId("mini-tree")).toContainText("Famille proche");
  await page.getByTestId("detail-close").click();
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-root").selectOption({ label: "Me" });
  await page.getByTestId("tree-node").filter({ hasText: /^Mum/ }).click();
  await expect(page.getByTestId("tree-detail-panel").getByTestId("mini-tree")).toBeVisible();
});
