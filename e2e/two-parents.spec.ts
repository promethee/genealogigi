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
  await page.getByTestId("rel-second").selectOption({ label: child });
  await page.getByTestId("rel-first").selectOption({ label: a });
  await page.getByTestId("rel-parent-b").selectOption({ label: b });
}

test("'Parent of' is the one parent type: parent, optional other parent, child", async ({
  page,
}) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await expect(page.getByTestId("rel-kind")).toHaveValue("parent");
  await expect(page.getByTestId("rel-kind").locator("option")).toHaveCount(2);
  for (const id of ["rel-first", "rel-parent-b", "rel-second", "rel-nature"]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await expect(page.getByTestId("rel-parent-b")).toHaveValue(""); // optional: None
});

test("with no other parent, a single parent link is added", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText(["Ada is parent of Byron"]);
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
  await expect(page.getByTestId("rel-second")).toHaveValue("");

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
  await expect(page.getByTestId("rel-add")).toBeDisabled(); // nothing chosen yet

  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("already exists");
  await expect(page.getByTestId("relationship-row")).toHaveCount(2);
});

test("a person can never end up as their own parent or as both parents", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron");
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-first").selectOption({ label: "Cleo" }); // Cleo was the other parent
  await expect(page.getByTestId("rel-parent-b")).toHaveValue("");
  await page.getByTestId("rel-second").selectOption({ label: "Cleo" }); // and now the child
  await expect(page.getByTestId("rel-first")).toHaveValue("");
  await expect(page.getByTestId("rel-add")).toBeDisabled();
});

test("optionally records the parents as partners, once", async ({ page }) => {
  await familyWith(page, "Ada", "Cleo", "Byron", "Dan");
  await expect(page.getByTestId("rel-partners")).toHaveCount(0); // needs an other parent
  await pick(page, "Byron", "Ada", "Cleo");
  await expect(page.getByTestId("rel-partners")).not.toBeChecked();
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
  await expect(page.getByTestId("rel-kind")).toContainText("Parent de");
  await pick(page, "Byron", "Ada", "Cleo");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada est parent de Byron",
    "Cleo est parent de Byron",
  ]);
});
