import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
// Fake PlatformAPI whose settings also remember the language, so a reload keeps it.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/lang.json",
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
        getLanguage: async () => read("fake:language"),
        setLanguage: async (l: string) => localStorage.setItem("fake:language", l),
      },
      git: { status: async () => "not-repo", sync: async () => "no-changes" },
      exit: async () => {},
    };
  });
});

async function addPerson(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function newFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
}

test("the switch is visible at the top right on the welcome screen and changes its text", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("create")).toHaveText("Create new family…");
  const box = await page.getByTestId("language-switch").boundingBox();
  const viewport = page.viewportSize();
  expect(box!.x + box!.width).toBeGreaterThan(viewport!.width - 60);
  expect(box!.y).toBeLessThan(40);
  await expect(page.getByTestId("lang-en")).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("lang-fr")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("create")).toHaveText("Créer une nouvelle famille…");
  await expect(page.getByTestId("open")).toHaveText("Ouvrir un fichier famille…");
  await expect(page.getByTestId("resume")).toHaveText("Reprendre la dernière famille");
});

test("the switch stays visible when a family is open, and labels, plurals and hints follow", async ({
  page,
}) => {
  await newFamily(page);
  await expect(page.getByTestId("language-switch")).toBeVisible();
  await expect(page.getByTestId("loaded-summary")).toHaveText("0 people · 0 relationships");

  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("loaded-summary")).toHaveText("0 personne · 0 relation");
  await expect(page.getByTestId("tab-list")).toHaveText("Personnes");
  await expect(page.getByTestId("tab-tree")).toHaveText("Arbre");
  await expect(page.getByTestId("add-person")).toHaveText("Ajouter une personne");
  await expect(page.getByTestId("empty-state")).toContainText("Aucune personne");
  await expect(page.getByTestId("relationships-hint")).toContainText("au moins deux personnes");
  await expect(page.getByTestId("language-switch")).toBeVisible();

  await addPerson(page, "Ada");
  await addPerson(page, "Byron");
  await expect(page.getByTestId("loaded-summary")).toContainText("2 personnes");
  await page.getByTestId("lang-en").click();
  await expect(page.getByTestId("loaded-summary")).toContainText("2 people");
});

test("switching language keeps what was typed in the form", async ({ page }) => {
  await newFamily(page);
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("first-name")).toHaveValue("Ada");
  await expect(page.getByTestId("first-name")).toHaveAttribute("placeholder", "Prénom");
  await expect(page.getByTestId("add-last-name")).toContainText("Nom de famille changé");
  await expect(page.getByTestId("submit-person")).toHaveText("Enregistrer");
  await expect(page.getByTestId("birth-month")).toContainText("Décembre");
});

test("the choice is remembered after a restart", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("lang-fr").click();
  await page.reload();
  await expect(page.getByTestId("create")).toHaveText("Créer une nouvelle famille…");
  await expect(page.getByTestId("lang-fr")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("relationship rows, errors and dates are French in French", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada");
  await addPerson(page, "Byron");
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-nature").selectOption("foster");
  await page.getByTestId("rel-start-year").fill("1990");
  await page.getByTestId("rel-start-month").selectOption("12");
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("relationship-text")).toHaveText(
    "Ada est parent de Byron (famille d’accueil, depuis déc. 1990)",
  );

  await page.getByTestId("rel-kind").selectOption("parent");

  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Ada" });
  await page.getByTestId("rel-add").click();
  await expect(page.getByTestId("error")).toHaveText(
    "Une personne ne peut pas être son propre parent.",
  );
  await page.getByTestId("lang-en").click();
  await expect(page.getByTestId("relationship-text")).toHaveText(
    "Ada is parent of Byron (foster, from Dec 1990)",
  );
});

test("the saved file does not depend on the language", async ({ page }) => {
  const record = async (language: "en" | "fr") => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByTestId(`lang-${language}`).click();
    await page.getByTestId("create").click();
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill("Ada");
    await page.getByTestId("birth-year").fill("1815");
    await page.getByTestId("birth-month").selectOption("12");
    await page.getByTestId("submit-person").click();
    const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/lang.json"));
    return (file ?? "").replace(/"id":"[^"]+"/g, '"id":"x"');
  };
  const english = await record("en");
  const french = await record("fr");
  expect(english).toContain("1815");
  expect(french).toBe(english);
});

test.describe("first launch on a French system", () => {
  test.use({ locale: "fr-FR" });

  test("starts in French when nothing was saved", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("create")).toHaveText("Créer une nouvelle famille…");
    await expect(page.getByTestId("lang-fr")).toHaveAttribute("aria-pressed", "true");
  });

  test("a saved choice wins over the system language", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("fake:language", "en"));
    await page.goto("/");
    await expect(page.getByTestId("create")).toHaveText("Create new family…");
  });
});

test("French says vivant(e) for a living person in the form only, not in the list or the card", async ({
  page,
}) => {
  await newFamily(page);
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await expect(page.getByTestId("life-status")).toContainText("Vivant(e)");
  await page.getByTestId("submit-person").click();
  // Living is the usual case: neither the list nor the card spells it out.
  await expect(page.getByTestId("person-life")).toHaveCount(0);
  await page.getByTestId("view-person").click();
  await expect(page.getByTestId("detail-status")).toHaveCount(0);
});
