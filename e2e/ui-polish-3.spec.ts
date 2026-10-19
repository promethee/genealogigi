import { expect, test, type Page } from "@playwright/test";

// The real in-app confirmation dialog (dev seam) so its button tones can be checked.
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

async function familyWithPartners(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("family-name")).toBeVisible();
  await add(page, "Ada");
  await add(page, "Byron");
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);
}

test("opening the person form puts the cursor in the first name", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("first-name")).toBeFocused();
});

test("the People / Tree switch sits on the left, before the search box", async ({ page }) => {
  await familyWithPartners(page);
  const tabs = (await page.getByTestId("tab-list").boundingBox())!;
  const search = (await page.getByTestId("search-box").boundingBox())!;
  expect(tabs.x + tabs.width).toBeLessThanOrEqual(search.x);
});

test("a person's name in the list is plain text, not a clickable control", async ({ page }) => {
  await familyWithPartners(page);
  const name = page.getByTestId("person-name").first();
  expect(await name.evaluate((el) => el.tagName)).toBe("SPAN");
  expect(await name.evaluate((el) => getComputedStyle(el).cursor)).not.toBe("pointer");
  await page.getByTestId("view-person").first().click(); // the View button still opens the card
  await expect(page.getByTestId("person-card")).toBeVisible();
});

test("the share confirmation is green and neutral; a delete confirmation keeps its warning look", async ({
  page,
}) => {
  await familyWithPartners(page);
  await page.getByTestId("share").click();
  await expect(page.getByTestId("confirm-ok")).toHaveClass(/btn-primary/);
  await expect(page.getByTestId("confirm-cancel")).toHaveClass(/btn-secondary/);
  await expect(page.getByTestId("confirm-ok")).toBeFocused();
  await page.getByTestId("confirm-cancel").click();
  await expect(page.getByTestId("confirm-dialog")).toHaveCount(0);

  await page.getByTestId("delete-relationship").click();
  await expect(page.getByTestId("confirm-cancel")).toHaveClass(/btn-danger/);
  await expect(page.getByTestId("confirm-ok")).toHaveClass(/btn-secondary/);
});

test("in the small family tree the partner segment has its own colour", async ({ page }) => {
  await familyWithPartners(page);
  await page.getByTestId("view-person").first().click();
  const partner = page.locator('[data-testid="mini-edge"][data-partner="true"]');
  await expect(partner).toHaveCount(1);
  const stroke = (loc: ReturnType<Page["locator"]>) =>
    loc.evaluate((el) => getComputedStyle(el).stroke);
  const family = page.locator('[data-testid="mini-edge"][data-partner="false"]');
  if ((await family.count()) > 0) {
    expect(await stroke(partner)).not.toBe(await stroke(family.first()));
  }
  const css = (name: string) =>
    page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n), name);
  expect((await css("--tree-partner")).trim()).not.toBe((await css("--tree-edge")).trim());
});

test("a name is saved as typed and shown with its first letter in uppercase", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("jean-pierre");
  await page.getByTestId("last-name").fill("mcDonald");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-name")).toHaveText("Jean-Pierre McDonald");
  const saved = await page.evaluate(() =>
    localStorage.getItem("fake:file:C:/families/polish.gigi"),
  );
  const names = JSON.parse(saved ?? "{}").people[0].names;
  expect(names.firstNames[0].value).toBe("jean-pierre"); // untouched
  expect(names.lastNames[0].value).toBe("mcDonald"); // inner capitals kept
});
