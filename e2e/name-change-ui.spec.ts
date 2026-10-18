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

async function newFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
}

async function startMarie(page: Page): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill("Marie");
  await page.getByTestId("last-name").first().fill("Martin");
}

test("a new person has a simple form: one first and one last name, no extra controls", async ({
  page,
}) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("first-name")).toHaveCount(1);
  await expect(page.getByTestId("last-name")).toHaveCount(1);
  for (const id of ["first-name-kind", "last-name-kind", "last-name-year", "last-name-primary"]) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
  await expect(page.getByTestId("add-last-name")).toContainText("Last name changed");
  await expect(page.getByTestId("add-first-name")).toContainText("First name changed");
});

test("marriage: the married name becomes main and the list shows the birth name as née", async ({
  page,
}) => {
  await newFamily(page);
  await startMarie(page);
  await page.getByTestId("add-last-name").click();
  await expect(page.getByTestId("last-name-kind").nth(1)).toHaveValue("married");
  await page.getByTestId("last-name").nth(1).fill("Dubois");
  await page.getByTestId("last-name-year").nth(1).fill("2001");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name")).toHaveText("Marie Dubois (née Martin)");

  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/names.json"));
  const last = JSON.parse(file ?? "null").people[0].names.lastNames;
  expect(last[0]).toMatchObject({ value: "Martin", kind: "birth" });
  expect(last[1]).toMatchObject({ value: "Dubois", kind: "married", primary: true });
});

test("a first-name change does not become the main name by itself", async ({ page }) => {
  await newFamily(page);
  await startMarie(page);
  await page.getByTestId("add-first-name").click();
  await page.getByTestId("first-name").nth(1).fill("Mia");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name")).toHaveText("Marie Martin");
});

test("choosing the birth name as main name removes the née", async ({ page }) => {
  await newFamily(page);
  await startMarie(page);
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("Dubois");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("edit-person").click();
  await expect(page.getByTestId("last-name-row")).toHaveCount(2); // detailed again
  await page.getByTestId("last-name-primary").first().check();
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name")).toHaveText("Marie Martin");
});

test("the tree box shows the name, then née and lifespan", async ({ page }) => {
  await newFamily(page);
  await startMarie(page);
  await page.getByTestId("birth-year").fill("1950");
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("Dubois");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill("Paul");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("rel-first").selectOption({ index: 1 });
  await page.getByTestId("rel-second").selectOption({ index: 2 });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-root").selectOption({ label: "Marie Dubois (née Martin)" });
  const box = page.getByTestId("tree-node").first();
  await expect(box).toContainText("Marie Dubois");
  await expect(box.getByTestId("tree-lifespan")).toHaveText("née Martin · 1950–");
});

test("a person edited with an existing single dated name shows detailed controls", async ({
  page,
}) => {
  await newFamily(page);
  await startMarie(page);
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("Dubois");
  await page.getByTestId("submit-person").click();
  await page.getByTestId("edit-person").click();
  await expect(page.getByTestId("last-name-kind")).toHaveCount(2);
  await expect(page.getByTestId("last-name-primary")).toHaveCount(2);
});
