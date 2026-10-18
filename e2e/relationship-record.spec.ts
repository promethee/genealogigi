import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/relations.json",
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

async function addPerson(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function familyWith(page: Page, ...names: string[]): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of names) await addPerson(page, name);
}

async function link(page: Page, kind: "parent" | "partner", first: string, second: string) {
  await page.getByTestId("rel-kind").selectOption(kind);
  await page.getByTestId("rel-first").selectOption({ label: first });
  await page.getByTestId("rel-second").selectOption({ label: second });
  await page.getByTestId("rel-add").click();
}

test("add controls are disabled until two people exist", async ({ page }) => {
  await familyWith(page, "Ada");
  await expect(page.getByTestId("relationships-hint")).toBeVisible();
  await expect(page.getByTestId("rel-add")).toBeDisabled();
  await addPerson(page, "Byron");
  await expect(page.getByTestId("rel-add")).toBeEnabled();
  await expect(page.getByTestId("relationships-empty")).toBeVisible();
});

test("adds a parent-child relationship and it survives a restart", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "parent", "Ada", "Byron");
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (biological, confirmed)",
  ]);

  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (biological, confirmed)",
  ]);
});

test("rejects a cycle, a duplicate and the same person twice", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "parent", "Ada", "Byron");

  await link(page, "parent", "Byron", "Ada");
  await expect(page.getByTestId("error")).toContainText("cycle");

  await link(page, "parent", "Ada", "Byron");
  await expect(page.getByTestId("error")).toContainText("already exists");

  await link(page, "parent", "Ada", "Ada");
  await expect(page.getByTestId("error")).toContainText("own parent");
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);
});

test("adds partners; reversed duplicate is rejected", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "partner", "Ada", "Byron");
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada and Byron are partners (ongoing)",
  ]);
  await link(page, "partner", "Byron", "Ada");
  await expect(page.getByTestId("error")).toContainText("already exists");
});

test("deleting a relationship respects cancel and confirm", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "partner", "Ada", "Byron");

  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("delete-relationship").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);

  await page.evaluate(() => localStorage.setItem("fake:confirm", "yes"));
  await page.getByTestId("delete-relationship").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
});

test("deleting a person also removes their relationships", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "parent", "Ada", "Byron");
  await page.getByTestId("delete-person").first().click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("relationships-empty")).toBeVisible();
  await expect(page.getByTestId("loaded-summary")).toContainText("0 relationships");
});
