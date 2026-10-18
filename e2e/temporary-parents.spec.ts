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

async function pick(page: Page, parent: string, child: string, nature: string): Promise<void> {
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: parent });
  await page.getByTestId("rel-second").selectOption({ label: child });
  await page.getByTestId("rel-nature").selectOption(nature);
}

test("adds an ended step link with a period and shows dates only when relevant", async ({
  page,
}) => {
  await familyWith(page, "Ada", "Byron");
  await pick(page, "Ada", "Byron", "step");
  await expect(page.getByTestId("rel-start-year")).toBeVisible();
  await expect(page.getByTestId("rel-end-year")).toBeHidden();
  await page.getByTestId("rel-link-status").selectOption("ended");
  await page.getByTestId("rel-start-year").fill("1990");
  await page.getByTestId("rel-end-year").fill("1995");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (step, 1990–1995)",
  ]);

  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (step, 1990–1995)",
  ]);
});

test("ongoing foster link shows its start; permanent natures hide the extra fields", async ({
  page,
}) => {
  await familyWith(page, "Ada", "Byron");
  await pick(page, "Ada", "Byron", "foster");
  await page.getByTestId("rel-start-year").fill("1990");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (foster, from 1990)",
  ]);
  await page.getByTestId("rel-nature").selectOption("adoptive");
  await expect(page.getByTestId("rel-start-year")).toBeHidden();
  await expect(page.getByTestId("rel-link-status")).toBeHidden();
});

test("rejects end before start, a bad date and a repeated nature", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await pick(page, "Ada", "Byron", "guardian");
  await page.getByTestId("rel-link-status").selectOption("ended");
  await page.getByTestId("rel-start-year").fill("1995");
  await page.getByTestId("rel-end-year").fill("1990");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("end date cannot be before");

  await page.getByTestId("rel-end-year").fill("");
  await page.getByTestId("rel-start-year").fill("");
  await page.getByTestId("rel-start-month").selectOption("4");
  await page.getByTestId("rel-start-day").fill("31");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("Start date");
  await expect(page.getByTestId("relationship-row")).toHaveCount(0);

  await page.getByTestId("rel-start-month").selectOption("");
  await page.getByTestId("rel-start-day").fill("");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-row")).toHaveCount(1);
  await pick(page, "Ada", "Byron", "guardian");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toContainText("already exists");
});

test("tree draws a foster parent with a dashed link", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await pick(page, "Ada", "Byron", "foster");
  await page.getByTestId("rel-add").click();
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-root").selectOption({ label: "Byron" });
  await expect(page.locator('[data-testid="tree-edge"][data-dashed="true"]')).toHaveCount(1);
});
