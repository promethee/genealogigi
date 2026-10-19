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
      confirm: async () => read("fake:confirm") !== "no",
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

type P = {
  first: string;
  last?: string;
  born?: string;
  bornPlace?: string;
  died?: string;
  diedPlace?: string;
};

async function person(page: Page, p: P): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill(p.first);
  if (p.last) await page.getByTestId("last-name").first().fill(p.last);
  if (p.born) await page.getByTestId("birth-year").fill(p.born);
  if (p.bornPlace) await page.getByTestId("birth-place").fill(p.bornPlace);
  if (p.died) {
    await page.getByTestId("life-status").selectOption("deceased");
    await page.getByTestId("death-year").fill(p.died);
    if (p.diedPlace) await page.getByTestId("death-place").fill(p.diedPlace);
  }
  await page.getByTestId("submit-person").click();
}

async function newFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
}

async function sample(page: Page): Promise<void> {
  await newFamily(page);
  await person(page, {
    first: "Ada",
    last: "Byron",
    born: "1815",
    bornPlace: "London",
    died: "1852",
    diedPlace: "Paris",
  });
  await person(page, { first: "Cleo", last: "King", born: "1810" });
  await person(page, { first: "Byron", last: "King", born: "1840" });
  await person(page, { first: "Sis", last: "King", born: "1842" });
  const parents = async (child: string, a: string, b: string) => {
    await page.getByTestId("rel-second").selectOption({ label: child });
    await page.getByTestId("rel-first").selectOption({ label: a });
    await page.getByTestId("rel-parent-b").selectOption({ label: b });
    await page.getByTestId("rel-add").click();
  };
  await parents("Byron King", "Ada Byron", "Cleo King");
  await parents("Sis King", "Ada Byron", "Cleo King");
}

test("the list shows 'born' and 'died' wording", async ({ page }) => {
  await newFamily(page);
  await person(page, { first: "Ada", born: "1815", died: "1852" });
  await expect(page.getByTestId("person-life")).toHaveText("born 1815 · died 1852");
});

test("clicking a name opens a read-only card with names, birth and death places", async ({
  page,
}) => {
  await sample(page);
  await page.getByTestId("person-name").first().click();
  await expect(page.getByTestId("person-card")).toBeVisible();
  await expect(page.getByTestId("detail-name")).toHaveText("Ada Byron");
  await expect(page.getByTestId("detail-born")).toHaveText("born 1815 in London");
  await expect(page.getByTestId("detail-status")).toHaveText("died 1852 in Paris");
  await expect(page.getByTestId("detail-names")).toContainText("Ada");
  await expect(page.getByTestId("detail-names")).not.toContainText("main"); // no "main" badge
  await expect(page.getByTestId("detail-names")).not.toContainText("Birth"); // default kind is not shown
  // Read-only: no form inputs.
  await expect(page.getByTestId("first-name")).toHaveCount(0);
});

test("relatives are listed and open that person's card", async ({ page }) => {
  await sample(page);
  await page.getByTestId("person-name").filter({ hasText: "Byron King" }).click();
  await expect(page.getByTestId("detail-parents")).toContainText("Ada Byron");
  await expect(page.getByTestId("detail-parents")).toContainText("Cleo King");
  await expect(page.getByTestId("detail-siblings")).toContainText("Sis King");
  await expect(page.getByTestId("detail-siblings")).not.toContainText("half-sibling");

  await page.getByTestId("detail-parents").getByTestId("detail-relative").first().click();
  await expect(page.getByTestId("detail-name")).toHaveText("Ada Byron");
  await expect(page.getByTestId("detail-children")).toContainText("Byron King");
  await expect(page.getByTestId("detail-children")).toContainText("Sis King");
});

test("a person without data shows a quiet card with no empty sections", async ({ page }) => {
  await newFamily(page);
  await person(page, { first: "Solo" });
  await page.getByTestId("person-name").click();
  await expect(page.getByTestId("detail-parents")).toHaveCount(0);
  await expect(page.getByTestId("detail-children")).toHaveCount(0);
  await expect(page.getByTestId("detail-siblings")).toHaveCount(0);
  await expect(page.getByTestId("detail-partners")).toHaveCount(0);
});

test("Edit opens the form, saving returns to the card", async ({ page }) => {
  await sample(page);
  await page.getByTestId("person-name").first().click();
  await page.getByTestId("detail-edit").click();
  await expect(page.getByTestId("birth-place")).toHaveValue("London");
  await expect(page.getByTestId("death-place")).toHaveValue("Paris");
  await page.getByTestId("first-name").first().fill("Adaline");
  await page.getByTestId("birth-place").fill("Oxford");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Adaline Byron");
  await expect(page.getByTestId("detail-born")).toHaveText("born 1815 in Oxford");
});

test("Delete exists only on the card and asks for confirmation", async ({ page }) => {
  await sample(page);
  await expect(page.getByTestId("delete-person")).toHaveCount(0);
  await page.getByTestId("person-name").filter({ hasText: "Sis King" }).click();
  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("detail-delete").click();
  await expect(page.getByTestId("person-row")).toHaveCount(4);
  await page.evaluate(() => localStorage.setItem("fake:confirm", "yes"));
  await page.getByTestId("detail-delete").click();
  await expect(page.getByTestId("person-row")).toHaveCount(3);
  await expect(page.getByTestId("person-card")).toHaveCount(0);
});

test("a birth place without a date is saved, a living person has no death place", async ({
  page,
}) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("birth-place").fill("Lyon");
  await expect(page.getByTestId("death-place")).toHaveCount(0);
  await page.getByTestId("submit-person").click();
  await page.getByTestId("person-name").click();
  await expect(page.getByTestId("detail-born")).toHaveText("born in Lyon");
  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/names.json"));
  expect(JSON.parse(file ?? "null").people[0].born).toMatchObject({ birthPlace: "Lyon" });
});

test("saved places are suggested", async ({ page }) => {
  await sample(page);
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("birth-place")).toHaveAttribute("list", "place-suggestions");
  const places = await page
    .locator("datalist#place-suggestions option")
    .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
  expect(places.sort()).toEqual(["London", "Paris"]);
});

test("the card is French in French", async ({ page }) => {
  await sample(page);
  await page.getByTestId("person-name").first().click();
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("detail-born")).toHaveText("né(e) 1815 à London");
  await expect(page.getByTestId("detail-status")).toHaveText("décédé(e) 1852 à Paris");
  await expect(page.getByTestId("detail-edit")).toContainText("Modifier");
});

test.describe("in the tree", () => {
  async function openTree(page: Page): Promise<void> {
    await sample(page);
    await page.getByTestId("tab-tree").click();
    await page.getByTestId("tree-root").selectOption({ label: "Byron King" });
  }
  const node = (page: Page, text: string) =>
    page.getByTestId("tree-node").filter({ hasText: new RegExp(`^${text}`) });

  test("clicking a person opens their card below the chart without changing the root", async ({
    page,
  }) => {
    await openTree(page);
    await node(page, "Ada").click();
    await expect(page.getByTestId("tree-detail-panel")).toBeVisible();
    await expect(page.getByTestId("detail-name")).toHaveText("Ada Byron");
    await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText(
      "Byron King",
    );
    await expect(page.locator('[data-testid="tree-node"][data-selected="true"]')).toContainText(
      "Ada",
    );
    // Below the chart, not beside it.
    const chart = (await page.getByTestId("tree-svg").boundingBox())!;
    const panel = (await page.getByTestId("tree-detail-panel").boundingBox())!;
    expect(panel.y).toBeGreaterThanOrEqual(chart.y + chart.height - 1);
  });

  test("double-click and 'Show tree from here' re-root", async ({ page }) => {
    await openTree(page);
    await node(page, "Ada").dblclick();
    await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Ada");
    await page.getByTestId("tree-root").selectOption({ label: "Byron King" });
    await node(page, "Cleo").click();
    await page.getByTestId("detail-center").click();
    await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText("Cleo");
  });

  test("edit in place: the chart shows the new name and the card returns to view", async ({
    page,
  }) => {
    await openTree(page);
    await node(page, "Ada").click();
    await page.getByTestId("detail-edit").click();
    await page.getByTestId("first-name").first().fill("Adaline");
    await page.getByTestId("submit-person").click();
    await expect(page.getByTestId("detail-name")).toHaveText("Adaline Byron");
    await expect(node(page, "Adaline")).toHaveCount(1);
  });

  test("a relative in the card moves the selection; Close hides the card", async ({ page }) => {
    await openTree(page);
    await node(page, "Ada").click();
    await page.getByTestId("detail-children").getByTestId("detail-relative").first().click();
    await expect(page.getByTestId("detail-name")).toHaveText("Byron King");
    await page.getByTestId("detail-close").click();
    await expect(page.getByTestId("tree-detail-panel")).toHaveCount(0);
  });

  test("Delete on the tree card removes the person and closes the card", async ({ page }) => {
    await openTree(page);
    await node(page, "Cleo").click();
    await page.getByTestId("detail-delete").click();
    await expect(page.getByTestId("tree-detail-panel")).toHaveCount(0);
    await expect(node(page, "Cleo")).toHaveCount(0);
  });
});

test("a name that is not the default kind still shows its kind", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill("Ada");
  await page.getByTestId("last-name").first().fill("Byron");
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("King");
  await page.getByTestId("last-name-kind").nth(1).selectOption("married");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("view-person").click();
  const names = page.getByTestId("detail-names");
  await expect(names).toContainText("King");
  await expect(names).toContainText("Married");
  await expect(names).not.toContainText("Birth");
});
