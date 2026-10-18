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

async function add(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function start(page: Page, ...names: string[]): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const n of names) await add(page, n);
}

const texts = (page: Page) => page.getByTestId("relationship-text").allTextContents();

test("no Parents section when nobody exists yet, nor when editing", async ({ page }) => {
  await start(page);
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("new-parents")).toHaveCount(0);
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();

  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("new-parents")).toBeVisible();
  await page.getByTestId("cancel-person").click();
  await page.getByTestId("view-person").click();
  await page.getByTestId("detail-edit").click();
  await expect(page.getByTestId("new-parents")).toHaveCount(0);
});

test("creating a person with two parents saves the person and both links", async ({ page }) => {
  await start(page, "Ada", "Cleo");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await page.getByTestId("new-parent-a").selectOption({ label: "Ada" });
  await page.getByTestId("new-parent-b").selectOption({ label: "Cleo" });
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(3);
  expect((await texts(page)).sort()).toEqual(["Ada is parent of Byron", "Cleo is parent of Byron"]);
  await expect(page.getByTestId("loaded-summary")).toContainText("3 people · 2 relationships");
});

test("one parent, with an adoptive nature", async ({ page }) => {
  await start(page, "Ada");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await expect(page.getByTestId("new-parent-nature")).toHaveCount(0);
  await page.getByTestId("new-parent-b").selectOption({ label: "Ada" });
  await page.getByTestId("new-parent-nature").selectOption("adoptive");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (adoptive)",
  ]);
});

test("no parent chosen creates only the person", async ({ page }) => {
  await start(page, "Ada");
  await add(page, "Byron");
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
});

test("the same parent twice is refused and nothing is saved", async ({ page }) => {
  await start(page, "Ada");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await page.getByTestId("new-parent-a").selectOption({ label: "Ada" });
  await page.getByTestId("new-parent-b").selectOption({ label: "Ada" });
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toContainText("must be different people");
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
});

test("an invalid person saves no parent links either", async ({ page }) => {
  await start(page, "Ada");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await page.getByTestId("birth-year").fill(String(new Date().getFullYear() + 1));
  await page.getByTestId("new-parent-a").selectOption({ label: "Ada" });
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toContainText("cannot be in the future");
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);
});

test("optionally records the parents as partners, only when they are not yet", async ({ page }) => {
  await start(page, "Ada", "Cleo");
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Byron");
  await expect(page.getByTestId("new-parent-partners")).toHaveCount(0);
  await page.getByTestId("new-parent-a").selectOption({ label: "Ada" });
  await page.getByTestId("new-parent-b").selectOption({ label: "Cleo" });
  await page.getByTestId("new-parent-partners").check();
  await page.getByTestId("submit-person").click();
  expect((await texts(page)).sort()).toEqual([
    "Ada and Cleo are partners",
    "Ada is parent of Byron",
    "Cleo is parent of Byron",
  ]);

  // Now they are partners, so the box is not offered again.
  await page.getByTestId("add-person").click();
  await page.getByTestId("new-parent-a").selectOption({ label: "Ada" });
  await page.getByTestId("new-parent-b").selectOption({ label: "Cleo" });
  await expect(page.getByTestId("new-parent-partners")).toHaveCount(0);
});

test("French labels", async ({ page }) => {
  await start(page, "Ada");
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("new-parents")).toContainText("Parents (facultatif)");
  await expect(page.getByTestId("new-parent-a")).toContainText("Aucun");
});
