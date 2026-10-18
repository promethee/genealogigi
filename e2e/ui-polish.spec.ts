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

test("the language switch shows a flag and the language's own name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("lang-en")).toContainText("English");
  await expect(page.getByTestId("lang-fr")).toContainText("Français");
  await expect(page.locator('[data-testid="lang-en"] [data-flag="en"]')).toBeVisible();
  await expect(page.locator('[data-testid="lang-fr"] [data-flag="fr"]')).toBeVisible();
  // The flag is an image drawn by the app, not an emoji, so it renders on Windows.
  await expect(page.locator('[data-testid="lang-fr"] svg').first()).toBeVisible();

  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("lang-en")).toContainText("English"); // not "Anglais"
  await expect(page.getByTestId("lang-fr")).toContainText("Français");
  await expect(page.getByTestId("lang-fr")).toHaveAttribute("aria-pressed", "true");
});

test("welcome screen: name, tagline and three icon buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("tagline")).toHaveText(
    "Your family tree, kept in one file you own.",
  );
  for (const id of ["resume", "open", "create"]) {
    await expect(page.getByTestId(id).locator("svg")).toBeVisible();
  }
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("tagline")).toContainText("Votre arbre généalogique");
});

test("Edit and Delete look like buttons: bordered, with an icon, Delete in red", async ({
  page,
}) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();
  for (const id of ["edit-person", "delete-person"]) {
    const button = page.getByTestId(id);
    await expect(button.locator("svg")).toBeVisible();
    await expect(button).toHaveCSS("border-top-width", "1px");
    await expect(button).toHaveCSS("cursor", "pointer");
  }
  // Delete is visually distinct (red) from Edit.
  const colorOf = (id: string) => page.getByTestId(id).evaluate((el) => getComputedStyle(el).color);
  expect(await colorOf("delete-person")).not.toBe(await colorOf("edit-person"));
});

test("the people list shows an avatar with initials", async ({ page }) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Marie");
  await page.getByTestId("last-name").fill("Dubois");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toContainText("MD");
});

test("a new person starts as living", async ({ page }) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await expect(page.getByTestId("life-status")).toHaveValue("living");
  await expect(page.getByTestId("death-year")).toHaveCount(0);
});

test("an old birth year switches the status to deceased, and back", async ({ page }) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("birth-year").fill("1815");
  await expect(page.getByTestId("life-status")).toHaveValue("deceased");
  await expect(page.getByTestId("death-year")).toBeVisible();
  await page.getByTestId("birth-year").fill("1990");
  await expect(page.getByTestId("life-status")).toHaveValue("living");
  await page.getByTestId("birth-year").fill("");
  await expect(page.getByTestId("life-status")).toHaveValue("living");
});

test("a status the user picked is never changed automatically", async ({ page }) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("life-status").selectOption("living");
  await page.getByTestId("birth-year").fill("1815");
  await expect(page.getByTestId("life-status")).toHaveValue("living");
});

test("unknown is still selectable and an existing unknown status is shown when editing", async ({
  page,
}) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("life-status").selectOption("unknown");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-life")).toHaveCount(0);
  await page.getByTestId("edit-person").click();
  await expect(page.getByTestId("life-status")).toHaveValue("unknown");
});

test("the relationships list leaves confirmed biological unmarked and shows other natures", async ({
  page,
}) => {
  await newFamily(page);
  for (const name of ["Ada", "Byron", "Cleo"]) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(name);
    await page.getByTestId("submit-person").click();
  }
  const add = async (parent: string, child: string, nature: string) => {
    await page.getByTestId("rel-first").selectOption({ label: parent });
    await page.getByTestId("rel-second").selectOption({ label: child });
    await page.getByTestId("rel-nature").selectOption(nature);
    await page.getByTestId("rel-add").click();
  };
  await expect(page.getByTestId("rel-nature")).toHaveValue("biological-confirmed"); // preselected
  await add("Ada", "Byron", "biological-confirmed");
  await add("Ada", "Cleo", "adoptive");
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada is parent of Byron",
    "Ada is parent of Cleo (adoptive)",
  ]);
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("relationship-text")).toHaveText([
    "Ada est parent de Byron",
    "Ada est parent de Cleo (adoptif)",
  ]);
});
