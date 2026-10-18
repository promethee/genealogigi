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

async function familyWith(page: Page, ...names: string[]): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of names) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(name);
    await page.getByTestId("submit-person").click();
  }
}

async function pick(page: Page, child: string, a: string, b: string) {
  await page.getByTestId("rel-child").selectOption({ label: child });
  await page.getByTestId("rel-parent-a").selectOption({ label: a });
  await page.getByTestId("rel-parent-b").selectOption({ label: b });
}

test("'Parents of' is the default type and shows child and two parents", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await expect(page.getByTestId("rel-kind")).toHaveValue("parents");
  for (const id of ["rel-child", "rel-parent-a", "rel-parent-b", "rel-nature"]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await expect(page.getByTestId("rel-first")).toHaveCount(0);
});

test("adds both parents of a child in one step and survives a restart", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron",
    "Cleo is parent of Byron",
  ]);
  // The form is reset for the next family.
  await expect(page.getByTestId("rel-child")).toHaveValue("");

  await page.reload();
  await page.getByTestId("resume").click();
  await page.getByTestId("tab-list").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
});

test("the nature and dates apply to both links", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-nature").selectOption("foster");
  await page.getByTestId("rel-start-year").fill("2000");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (foster, from 2000)",
    "Cleo is parent of Byron (foster, from 2000)",
  ]);
});

test("the same person twice, missing choices and an existing link add nothing", async ({
  page,
}) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("Choose a child and two parents.");

  await pick(page, "Byron", "Ada", "Ada");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("must be different people");
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);

  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("already exists");
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
});

test("a parent equal to the child is refused", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await pick(page, "Byron", "Byron", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("own parent");
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
});

test("optionally records the parents as partners, once", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron", "Dan");
  await expect(page.getByTestId("rel-partners")).not.toBeChecked();
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-partners").check();
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron",
    "Cleo is parent of Byron",
    "Ada and Cleo are partners",
  ]);

  // Already partners: the checkbox disappears for that couple.
  await pick(page, "Dan", "Ada", "Cleo");
  await expect(page.getByTestId("rel-partners")).toHaveCount(0);
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(5);
});

test("French labels", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("rel-kind")).toContainText("Parents de");
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada est parent de Byron",
    "Cleo est parent de Byron",
  ]);
});
