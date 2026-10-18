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
}

const box = async (page: Page, name: string) =>
  (await page
    .getByTestId("tree-node")
    .filter({ hasText: new RegExp(`^${name}`) })
    .first()
    .boundingBox())!;

test("ancestors are drawn above the root, generation by generation", async ({ page }) => {
  await buildFamily(page);
  const [me, mum, dad, gran, great] = await Promise.all(
    ["Me", "Mum", "Dad", "Gran", "GreatGran"].map((n) => box(page, n)),
  );
  // Root at the bottom, each older generation higher up.
  expect(mum!.y).toBeLessThan(me!.y);
  expect(gran!.y).toBeLessThan(mum!.y);
  expect(great!.y).toBeLessThan(gran!.y);
  // Both parents are on the same level, side by side, and the root sits between them.
  expect(dad!.y).toBeCloseTo(mum!.y, 0);
  expect(dad!.x).not.toBeCloseTo(mum!.x, 0);
  const middle = (mum!.x + dad!.x) / 2;
  expect(me!.x).toBeCloseTo(middle, 0);
});

test("links join the bottom of a parent to the top of the child", async ({ page }) => {
  await buildFamily(page);
  const [me, mum] = await Promise.all(["Me", "Mum"].map((n) => box(page, n)));
  const edges = page.getByTestId("tree-edge");
  await expect(edges).toHaveCount(4);
  const first = (await edges.first().getAttribute("d"))!;
  // Vertical-first elbow: "M x y V mid H x V y".
  expect(first).toMatch(/^M [\d.]+ [\d.]+ V [\d.]+ H [\d.]+ V [\d.]+$/);
  expect(me!.y).toBeGreaterThan(mum!.y + mum!.height - 1);
});

test("descendants hang below the root", async ({ page }) => {
  await buildFamily(page);
  await page.getByTestId("tree-direction").selectOption("descendants");
  await page.getByTestId("tree-root").selectOption({ label: "GreatGran" });
  const [great, gran, mum, me] = await Promise.all(
    ["GreatGran", "Gran", "Mum", "Me"].map((n) => box(page, n)),
  );
  expect(great!.y).toBeLessThan(gran!.y);
  expect(gran!.y).toBeLessThan(mum!.y);
  expect(mum!.y).toBeLessThan(me!.y);
});

test("the chart scrolls once it would have to shrink below its floor", async ({ page }) => {
  await buildFamily(page);
  const natural = Number(await page.getByTestId("tree-svg").getAttribute("width"));
  await page.setViewportSize({ width: Math.round(natural * 0.3), height: 600 });
  const scroller = page.getByTestId("tree-svg").locator("xpath=..");
  await expect(scroller).toHaveCSS("overflow-x", "auto");
  const { client, scroll } = await scroller.evaluate((el) => ({
    client: el.clientWidth,
    scroll: el.scrollWidth,
  }));
  expect(scroll).toBeGreaterThan(client);
});

test("the chart shrinks to fit the panel instead of scrolling, down to a floor", async ({
  page,
}) => {
  await buildFamily(page);
  const svg = page.getByTestId("tree-svg");
  const scroller = svg.locator("xpath=..");
  const natural = Number(await svg.getAttribute("width"));

  await page.setViewportSize({ width: 1400, height: 800 });
  const wide = (await svg.boundingBox())!.width;
  expect(wide).toBeCloseTo(natural, 0); // enough room: natural size, no upscaling

  const fits = Math.round(natural * 0.7) + 80; // panel and page padding included
  await page.setViewportSize({ width: fits, height: 800 });
  const shrunk = (await svg.boundingBox())!.width;
  expect(shrunk).toBeLessThan(natural);
  expect(shrunk).toBeGreaterThan(natural * 0.45);
  expect(await scroller.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});
