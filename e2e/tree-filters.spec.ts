import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/filters.gigi",
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

interface Spec {
  first: string;
  last: string;
  year: string;
  month: string;
  place: string;
  deathYear?: string;
  deathMonth?: string;
  deathPlace?: string;
}

async function addPerson(page: Page, s: Spec): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(s.first);
  await page.getByTestId("last-name").fill(s.last);
  await page.getByTestId("birth-year").fill(s.year);
  await page.getByTestId("birth-month").selectOption(s.month);
  await page.getByTestId("birth-place").fill(s.place);
  await page.getByTestId("life-status").selectOption(s.deathYear ? "deceased" : "living");
  if (s.deathYear) {
    await page.getByTestId("death-year").fill(s.deathYear);
    await page.getByTestId("death-month").selectOption(s.deathMonth ?? "");
    await page.getByTestId("death-place").fill(s.deathPlace ?? "");
  }
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row").filter({ hasText: s.first })).toHaveCount(1);
}

/** Paul (b. Mar 1930 Lyon, d. Nov 2009 Annecy) is Léa's grandfather; Léa b. Mar 1988 Paris, living. */
async function build(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, { first: "Léa", last: "Dubois", year: "1988", month: "3", place: "Paris" });
  await addPerson(page, {
    first: "Paul",
    last: "Laurent",
    year: "1930",
    month: "3",
    place: "Lyon",
    deathYear: "2009",
    deathMonth: "11",
    deathPlace: "Annecy",
  });
  await addPerson(page, {
    first: "Odile",
    last: "Laurent",
    year: "1958",
    month: "6",
    place: "Lyon",
  });
  for (const [parent, child] of [
    ["Odile Laurent", "Léa Dubois"],
    ["Paul Laurent", "Odile Laurent"],
  ]) {
    await page.getByTestId("rel-kind").selectOption("parent");
    await page.getByTestId("rel-first").selectOption({ label: parent! });
    await page.getByTestId("rel-second").selectOption({ label: child! });
    await page.getByTestId("rel-add").click();
  }
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await page.getByTestId("tree-root").selectOption({ label: "Léa Dubois" });
  await page.getByTestId("filters-toggle").click();
}

const faded = (page: Page) => page.locator('[data-testid="tree-node"][data-faded="true"]');
const node = (page: Page, name: string) =>
  page.getByTestId("tree-node").filter({ hasText: new RegExp(`^${name}`) });

test("filters are collapsed by default and stay open while one is on", async ({ page }) => {
  await build(page);
  await page.getByTestId("filters-toggle").click(); // collapse again
  await expect(page.getByTestId("filter-status")).toHaveCount(0);
  await page.getByTestId("filters-toggle").click();
  await page.getByTestId("filter-status").selectOption("living");
  await page.getByTestId("filters-toggle").click(); // cannot hide an active filter
  await expect(page.getByTestId("filter-status")).toBeVisible();
  await expect(page.getByTestId("filters-toggle")).toContainText("1");
});

test("nothing is faded until a filter is chosen", async ({ page }) => {
  await build(page);
  await expect(faded(page)).toHaveCount(0);
  await expect(page.getByTestId("filter-count")).toHaveCount(0);
});

test("Living fades the deceased, and keeps them clickable", async ({ page }) => {
  await build(page);
  await page.getByTestId("filter-status").selectOption("living");
  await expect(faded(page)).toHaveCount(1);
  await expect(node(page, "Paul")).toHaveAttribute("data-faded", "true");
  await expect(node(page, "Paul")).toHaveCSS("opacity", "0.3");
  await expect(page.getByTestId("filter-count")).toHaveText("2 people match");
  await node(page, "Paul").click();
  await expect(page.getByTestId("detail-name")).toContainText("Paul Laurent");
});

test("filters add up: place, month and last name", async ({ page }) => {
  await build(page);
  await page.getByTestId("filter-birth-place").selectOption("Lyon");
  await expect(faded(page)).toHaveCount(1); // Léa (Paris) faded
  await page.getByTestId("filter-birth-month").selectOption("3");
  await expect(faded(page)).toHaveCount(2); // Odile (June) fades too
  await expect(page.getByTestId("filter-count")).toHaveText("1 person matches");
  await page.getByTestId("filter-death-month").selectOption("11");
  await page.getByTestId("filter-death-place").selectOption("Annecy");
  await expect(faded(page)).toHaveCount(2);
  await page.getByTestId("filter-last-name").selectOption("Dubois");
  await expect(faded(page)).toHaveCount(3);
});

test("links to faded people fade, and Reset brings everything back", async ({ page }) => {
  await build(page);
  await page.getByTestId("filter-status").selectOption("living");
  await expect(page.locator('[data-testid="tree-edge"][opacity="0.25"]')).toHaveCount(1);
  await page.getByTestId("filter-reset").click();
  await expect(faded(page)).toHaveCount(0);
  await expect(page.getByTestId("filter-status")).toHaveValue("any");
  await expect(page.getByTestId("filter-reset")).toHaveCount(0);
});

test("filters are offered in French with month names", async ({ page }) => {
  await build(page);
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("filters")).toContainText("Estomper les personnes");
  await expect(page.getByTestId("filter-birth-month")).toContainText("mars");
  await page.getByTestId("filter-status").selectOption("living");
  await expect(page.getByTestId("filter-count")).toHaveText("2 personnes correspondent");
});
