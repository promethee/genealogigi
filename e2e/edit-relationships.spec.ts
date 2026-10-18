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

test("edits a parent link from adoptive to foster and it survives a restart", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await page.getByTestId("rel-nature").selectOption("adoptive");
  await link(page, "parent", "Ada", "Byron");
  await page.getByTestId("edit-relationship").click();
  await expect(page.getByTestId("edit-start-year")).toBeHidden();
  await page.getByTestId("edit-nature").selectOption("foster");
  await page.getByTestId("edit-start-year").fill("2000");
  await page.getByTestId("edit-save").click();
  await expect(page.getByTestId("relationship-edit-form")).toHaveCount(0);
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (foster, from 2000)",
  ]);

  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron (foster, from 2000)",
  ]);
});

test("edit form is prefilled and partner dates can be set", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "partner", "Ada", "Byron");
  await page.getByTestId("edit-relationship").click();
  await page.getByTestId("edit-status").selectOption("ended");
  await page.getByTestId("edit-start-year").fill("1990");
  await page.getByTestId("edit-end-year").fill("1995");
  await page.getByTestId("edit-save").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada and Byron are partners (ended, 1990–1995)",
  ]);

  await page.getByTestId("edit-relationship").click();
  await expect(page.getByTestId("edit-start-year")).toHaveValue("1990");
  await expect(page.getByTestId("edit-end-year")).toHaveValue("1995");
});

test("invalid edit shows an error and cancel leaves the link unchanged", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await link(page, "partner", "Ada", "Byron");
  await page.getByTestId("edit-relationship").click();
  await page.getByTestId("edit-status").selectOption("ended");
  await page.getByTestId("edit-start-year").fill("1995");
  await page.getByTestId("edit-end-year").fill("1990");
  await page.getByTestId("edit-save").click();
  await expect(page.getByTestId("error")).toContainText("end date cannot be before");
  await expect(page.getByTestId("relationship-edit-form")).toBeVisible();

  await page.getByTestId("edit-cancel").click();
  await expect(page.getByTestId("relationship-edit-form")).toHaveCount(0);
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada and Byron are partners (ongoing)",
  ]);
});

test("adds partners with a start date", async ({ page }) => {
  await familyWith(page, "Ada", "Byron");
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-start-year").fill("1990");
  await link(page, "partner", "Ada", "Byron");
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada and Byron are partners (ongoing, from 1990)",
  ]);
});
