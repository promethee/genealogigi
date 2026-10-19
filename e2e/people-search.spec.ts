import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/search.gigi",
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

async function build(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const [first, last] of [
    ["Léa", "Dubois"],
    ["Jeanne", "Martin"],
    ["Paul", "Laurent"],
  ]) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(first!);
    await page.getByTestId("last-name").fill(last!);
    await page.getByTestId("submit-person").click();
  }
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Léa Dubois" });
  await page.getByTestId("rel-add").click();
}

test("list view: the list shows only matches, accents and case ignored", async ({ page }) => {
  await build(page);
  await page.getByTestId("tab-list").click();
  await page.getByTestId("search").fill("LEA");
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("person-row")).toContainText("Léa Dubois");
  await page.getByTestId("search").fill("zzz");
  await expect(page.getByTestId("search-none")).toBeVisible();
  await expect(page.getByTestId("person-row")).toHaveCount(0);
  await page.getByTestId("search").press("Escape");
  await expect(page.getByTestId("person-row")).toHaveCount(3);
});

test("list view: Enter or a result opens the card", async ({ page }) => {
  await build(page);
  await page.getByTestId("tab-list").click();
  await page.getByTestId("search").fill("jeanne");
  await page.getByTestId("search").press("Enter");
  await expect(page.getByTestId("detail-name")).toContainText("Jeanne Martin");
});

test("tree view: matches are highlighted and a result focuses the tree on them", async ({
  page,
}) => {
  await build(page);
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("search").fill("dubois");
  await expect(page.locator('[data-testid="tree-node"][data-highlight="true"]')).toHaveCount(1);
  await page.getByTestId("search-result").first().click();
  await expect(page.getByTestId("tree-root")).toHaveValue(/.+/);
  await expect(page.getByTestId("detail-name")).toContainText("Léa Dubois");
  await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText(
    "Léa Dubois",
  );
});

test("the search is in French too", async ({ page }) => {
  await build(page);
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("search")).toHaveAttribute(
    "placeholder",
    "Rechercher un nom ou un lieu…",
  );
  await page.getByTestId("search").fill("zzz");
  await expect(page.getByTestId("search-none")).toHaveText("Aucune personne trouvée.");
});

test("toolbar: search in the centre, People/Tree switch on the right", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await build(page);
  await page.getByTestId("tab-list").click();
  const search = (await page.getByTestId("search").boundingBox())!;
  const tab = (await page.getByTestId("tab-list").boundingBox())!;
  const middle = (b: { y: number; height: number }) => b.y + b.height / 2;
  expect(Math.abs(middle(tab) - middle(search))).toBeLessThan(20);
  expect(search.x + search.width).toBeLessThan(tab.x);
  expect(Math.abs(search.x + search.width / 2 - 700)).toBeLessThan(30); // centred in the window
});

test("Add person sits left of the People title; Add relationship left of the Relationships title", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await build(page);
  await page.getByTestId("tab-list").click();
  const middle = (b: { y: number; height: number }) => b.y + b.height / 2;
  const add = (await page.getByTestId("add-person").boundingBox())!;
  const peopleTitle = (await page.getByTestId("people-section").locator("h2").boundingBox())!;
  expect(add.x + add.width).toBeLessThanOrEqual(peopleTitle.x);
  expect(Math.abs(middle(add) - middle(peopleTitle))).toBeLessThan(10);

  const rel = (await page.getByTestId("rel-add").boundingBox())!;
  const relTitle = (await page.getByTestId("relationships-section").locator("h2").boundingBox())!;
  expect(rel.x + rel.width).toBeLessThanOrEqual(relTitle.x);
  expect(Math.abs(middle(rel) - middle(relTitle))).toBeLessThan(10);
  // The two panels' headers line up.
  expect(Math.abs(middle(add) - middle(rel))).toBeLessThan(4);
});

test("the Tree tab keeps the search centred and the switch on the right", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await build(page);
  await page.getByTestId("tab-tree").click();
  await expect(page.getByTestId("add-person")).toHaveCount(0);
  const search = (await page.getByTestId("search").boundingBox())!;
  const tab = (await page.getByTestId("tab-tree").boundingBox())!;
  expect(Math.abs(search.x + search.width / 2 - 700)).toBeLessThan(30);
  expect(tab.x).toBeGreaterThan(search.x + search.width);
});

test("there is no Sync with Git button (parked for v2)", async ({ page }) => {
  await build(page);
  await expect(page.getByTestId("git-sync")).toHaveCount(0);
  await expect(page.getByTestId("git-hint")).toHaveCount(0);
});

test("the people list has a title with an icon, like the relationships", async ({ page }) => {
  await build(page);
  await page.getByTestId("tab-list").click();
  const section = page.getByTestId("people-section");
  await expect(section.locator("h2")).toHaveText("People");
  await expect(section.locator("h2 svg")).toBeVisible();
});

test("Enter closes the suggestions, and typing opens them again", async ({ page }) => {
  await build(page);
  await page.getByTestId("tab-list").click();
  await page.getByTestId("search").fill("l");
  await expect(page.getByTestId("search-results")).toBeVisible();
  await page.getByTestId("search").press("Enter");
  await expect(page.getByTestId("search-results")).toHaveCount(0);
  await page.getByTestId("search").pressSequentially("e"); // "le" still matches Léa
  await expect(page.getByTestId("search-results")).toBeVisible();
  await page.getByTestId("search").press("Enter");
  await expect(page.getByTestId("search-results")).toHaveCount(0);
});

test("Escape and clicking elsewhere also close the suggestions", async ({ page }) => {
  await build(page);
  await page.getByTestId("tab-list").click();
  await page.getByTestId("search").fill("a");
  await expect(page.getByTestId("search-results")).toBeVisible();
  await page.getByTestId("search").press("Escape");
  await expect(page.getByTestId("search-results")).toHaveCount(0);
  await expect(page.getByTestId("search")).toHaveValue("");
  await page.getByTestId("search").fill("a");
  await page.getByTestId("people-section").click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId("search-results")).toHaveCount(0);
});

test("the people list and the relationships panel start at the same height", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await build(page);
  await page.getByTestId("tab-list").click();
  const people = (await page.getByTestId("people-section").boundingBox())!;
  const rels = (await page.getByTestId("relationships-section").locator("xpath=..").boundingBox())!;
  expect(Math.abs(people.y - rels.y)).toBeLessThan(2);
});
