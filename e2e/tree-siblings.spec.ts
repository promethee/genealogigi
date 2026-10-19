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

async function person(page: Page, first: string, born?: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  if (born) await page.getByTestId("birth-year").fill(born);
  await page.getByTestId("submit-person").click();
}

/** Mum + Dad have Me (1980), Older (1975), Younger (1985); Mum + Step have Half. */
async function build(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const [n, y] of [
    ["Mum"],
    ["Dad"],
    ["Step"],
    ["Me", "1980"],
    ["Older", "1975"],
    ["Younger", "1985"],
    ["Half"],
  ] as [string, string?][]) {
    await person(page, n, y);
  }
  const parents = async (child: string, a: string, b: string) => {
    await page.getByTestId("rel-second").selectOption({ label: child });
    await page.getByTestId("rel-first").selectOption({ label: a });
    await page.getByTestId("rel-parent-b").selectOption({ label: b });
    await page.getByTestId("rel-add").click();
  };
  await parents("Me", "Mum", "Dad");
  await parents("Older", "Mum", "Dad");
  await parents("Younger", "Mum", "Dad");
  await parents("Half", "Mum", "Step");
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await page.getByTestId("tree-root").selectOption({ label: "Me" });
}

const node = (page: Page, text: string) =>
  page.getByTestId("tree-node").filter({ hasText: new RegExp(`^${text}`) });
const box = async (page: Page, text: string) => (await node(page, text).first().boundingBox())!;

test("siblings are shown by default, and can be switched off", async ({ page }) => {
  await build(page);
  await expect(page.getByTestId("tree-direction")).toHaveValue("hourglass");
  await expect(page.getByTestId("tree-siblings")).toBeChecked();
  await expect(page.getByTestId("tree-node")).toHaveCount(6); // Me, Mum, Dad + Older, Younger, Half
  const me = await box(page, "Me");
  for (const name of ["Older", "Younger", "Half"]) {
    expect((await box(page, name)).y).toBeCloseTo(me.y, 0);
  }
  await page.getByTestId("tree-siblings").uncheck();
  await expect(page.getByTestId("tree-node")).toHaveCount(3);
  await page.getByTestId("tree-siblings").check();
  await expect(page.getByTestId("tree-node")).toHaveCount(6);
});

test("older siblings are on the left, younger or unknown on the right", async ({ page }) => {
  await build(page);
  await page.getByTestId("tree-siblings").check();
  const [me, older, younger, half] = await Promise.all(
    ["Me", "Older", "Younger", "Half"].map((n) => box(page, n)),
  );
  expect(older.x).toBeLessThan(me.x);
  expect(younger.x).toBeGreaterThan(me.x);
  expect(half.x).toBeGreaterThan(me.x);
});

test("siblings are linked to the shared parents and only the root is highlighted", async ({
  page,
}) => {
  await build(page);
  await page.getByTestId("tree-siblings").check();
  // Me: 2 links; Older: 2; Younger: 2; Half: 1 (only Mum is shared and drawn).
  await expect(page.getByTestId("tree-edge")).toHaveCount(7);
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Me");
});

test("a sibling box opens its card, and double-click re-roots on it", async ({ page }) => {
  await build(page);
  await page.getByTestId("tree-siblings").check();
  await node(page, "Older").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Older");
  await expect(page.getByTestId("detail-siblings")).toContainText("Me");
  await node(page, "Younger").dblclick();
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText(
    "Younger",
  );
  // The option stays on, and Younger's own siblings are now shown.
  await expect(page.getByTestId("tree-siblings")).toBeChecked();
  await expect(node(page, "Older")).toHaveCount(1);
});

test("the option is not offered in the descendants view, but is in the hourglass", async ({
  page,
}) => {
  await build(page);
  await page.getByTestId("tree-direction").selectOption("descendants");
  await expect(page.getByTestId("tree-siblings")).toHaveCount(0);
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await expect(page.getByTestId("tree-siblings")).toBeVisible();
  await page.getByTestId("tree-siblings").check();
  await expect(page.getByTestId("tree-node")).toHaveCount(6);
});

test("a root without parents shows no siblings and nothing breaks", async ({ page }) => {
  await build(page);
  await page.getByTestId("tree-direction").selectOption("ancestors");
  await page.getByTestId("tree-root").selectOption({ label: "Mum" });
  await expect(page.getByTestId("tree-siblings")).toBeChecked();
  await expect(page.getByTestId("tree-node")).toHaveCount(1);
});

test("French label, and the card has an explicit Close button", async ({ page }) => {
  await build(page);
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("tree-siblings").locator("xpath=..")).toContainText(
    "Afficher les frères et sœurs",
  );
  await node(page, "Mum").click();
  await expect(page.getByTestId("detail-close")).toHaveText("Fermer");
  await page.getByTestId("lang-en").click();
  await expect(page.getByTestId("detail-close")).toHaveText("Close");
  await expect(page.getByTestId("detail-close").locator("svg")).toHaveCount(0);
});

test("the card's siblings title is singular for one sibling, plural for several (English and French)", async ({
  page,
}) => {
  await build(page); // Me has three siblings
  await page.getByTestId("tree-node").filter({ hasText: /^Me/ }).first().click();
  await expect(page.getByTestId("detail-siblings").locator("h3")).toHaveText("Siblings");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("detail-siblings").locator("h3")).toHaveText("Fratrie / sororité");
  await page.getByTestId("lang-en").click();

  // A new family where one child has exactly one sibling.
  await page.getByTestId("close-family").click();
  await page.getByTestId("create").click();
  for (const n of ["Mum", "Kid1", "Kid2"]) await person(page, n);
  for (const kid of ["Kid1", "Kid2"]) {
    await page.getByTestId("rel-kind").selectOption("parent");
    await page.getByTestId("rel-first").selectOption({ label: "Mum" });
    await page.getByTestId("rel-second").selectOption({ label: kid });
    await page.getByTestId("rel-add").click();
  }
  await page.getByTestId("tab-list").click();
  await page
    .getByTestId("person-row")
    .filter({ hasText: "Kid1" })
    .getByTestId("view-person")
    .click();
  await expect(page.getByTestId("detail-siblings").locator("h3")).toHaveText("Sibling");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("detail-siblings").locator("h3")).toHaveText("Frère / sœur");
});
