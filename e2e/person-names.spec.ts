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

/** Opens the add form with first name "Ada" and last name "Byron". */
async function startAda(page: Page): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill("Ada");
  await page.getByTestId("last-name").first().fill("Byron");
}

async function addNickname(page: Page, value: string): Promise<void> {
  await page.getByTestId("add-first-name").click();
  const index = (await page.getByTestId("first-name").count()) - 1;
  await page.getByTestId("first-name").nth(index).fill(value);
  await page.getByTestId("first-name-kind").nth(index).selectOption("nickname");
}

/** Values of every input with the given test id, in page order. */
const valuesOf = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));

const save = (page: Page) => page.getByTestId("submit-person").click();

test("adds a nickname and a married name with a year", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await addNickname(page, "Addie");
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("King");
  await page.getByTestId("last-name-kind").nth(1).selectOption("married");
  await page.getByTestId("last-name-year").nth(1).fill("1835");
  await save(page);

  // The new last name becomes the main name, so the birth name shows as "née".
  await expect(page.getByTestId("person-name")).toHaveText("Ada King (née Byron)");
  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/names.json"));
  const names = JSON.parse(file ?? "null").people[0].names;
  expect(names.firstNames.map((n: { kind: string }) => n.kind)).toEqual(["birth", "nickname"]);
  expect(names.lastNames[1]).toMatchObject({ value: "king", kind: "married" });
  expect(names.lastNames[1].date.yearKnown).toBe(true);
});

test("rejects an invalid name date", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("King"); // blank rows are ignored
  await page.getByTestId("last-name-year").nth(1).fill("1815");
  await page.getByTestId("last-name-month").nth(1).selectOption("4");
  await page.getByTestId("last-name-day").nth(1).fill("31");
  await save(page);
  await expect(page.getByTestId("error")).toContainText("Last name date");
  await expect(page.getByTestId("person-row")).toHaveCount(0);
});

test("the chosen primary name is the one displayed", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await addNickname(page, "Addie");
  await page.getByTestId("first-name-primary").nth(1).check();
  await save(page);
  await expect(page.getByTestId("person-name")).toHaveText("Addie Byron");

  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/names.json"));
  const first = JSON.parse(file ?? "null").people[0].names.firstNames;
  expect(first.filter((n: { primary?: boolean }) => n.primary)).toHaveLength(1);
  expect(first[1].primary).toBe(true);
});

test("up and down reorder names and are disabled at the ends", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await addNickname(page, "Addie");
  await expect(page.getByTestId("first-name-up").first()).toBeDisabled();
  await expect(page.getByTestId("first-name-down").last()).toBeDisabled();

  await page.getByTestId("first-name-down").first().click();
  await expect.poll(() => valuesOf(page, "first-name")).toEqual(["Addie", "Ada"]);
  await page.getByTestId("first-name-up").last().click();
  await expect.poll(() => valuesOf(page, "first-name")).toEqual(["Ada", "Addie"]);
});

test("blank rows are ignored, and all-blank is rejected", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await page.getByTestId("add-first-name").click(); // left blank
  await save(page);
  await expect(page.getByTestId("person-row")).toHaveCount(1);

  await page.getByTestId("add-person").click();
  await save(page);
  await expect(page.getByTestId("error")).toHaveText("At least one name is required.");
});

test("a person with several names can be edited without losing any, and survives a restart", async ({
  page,
}) => {
  await newFamily(page);
  await startAda(page);
  await addNickname(page, "Addie");
  await save(page);

  await page.getByTestId("view-person").click();
  await page.getByTestId("detail-edit").click();
  await expect.poll(() => valuesOf(page, "first-name")).toEqual(["Ada", "Addie"]);
  await expect(page.getByTestId("first-name-kind").nth(1)).toHaveValue("nickname");
  await page.getByTestId("birth-year").fill("1815");
  await save(page);
  await expect(page.getByTestId("person-life")).toHaveText("born 1815"); // living is not shown in the list

  await page.reload();
  await page.getByTestId("resume").click();
  await page.getByTestId("view-person").click();
  await page.getByTestId("detail-edit").click();
  await expect.poll(() => valuesOf(page, "first-name")).toEqual(["Ada", "Addie"]);
});

test("the tree shows the primary name", async ({ page }) => {
  await newFamily(page);
  await startAda(page);
  await addNickname(page, "Addie");
  await page.getByTestId("first-name-primary").nth(1).check();
  await save(page);
  await page.getByTestId("tab-tree").click();
  await expect(page.getByTestId("tree-node")).toContainText("Addie Byron");
});
