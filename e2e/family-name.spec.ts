import { expect, test } from "@playwright/test";

// The fake shell delegates promptText to the app's real in-app prompt (dev seam) and records the
// file name each save dialog suggests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown> & {
      __GENEALOGIGI_PROMPT__: (o: unknown) => Promise<string | null>;
    };
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async (options?: { defaultName?: string }) => {
        const names = JSON.parse(read("fake:defaultNames") ?? "[]") as string[];
        names.push(options?.defaultName ?? "");
        localStorage.setItem("fake:defaultNames", JSON.stringify(names));
        return names.length === 1 ? "C:/families/Laurent.gigi" : "C:/out/" + options?.defaultName;
      },
      confirm: async () => true,
      promptText: (options: unknown) => w.__GENEALOGIGI_PROMPT__(options),
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

const defaultNames = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("fake:defaultNames") ?? "[]") as string[]);

async function create(page: import("@playwright/test").Page, name: string): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("prompt-input").fill(name);
  await page.getByTestId("prompt-ok").click();
  await expect(page.getByTestId("family-name")).toBeVisible();
}

test("Create new asks for the family name before the save dialog", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("prompt-dialog")).toBeVisible();
  await expect(page.getByTestId("prompt-input")).toBeFocused();
  expect(await defaultNames(page)).toEqual([]); // the save dialog has not opened yet
  await page.getByTestId("prompt-input").fill("Famille Laurent");
  await page.getByTestId("prompt-ok").click();
  await expect(page.getByTestId("family-name")).toHaveText("Famille Laurent");
  expect(await defaultNames(page)).toEqual(["Famille Laurent.gigi"]);
  const file = await page.evaluate(() =>
    localStorage.getItem("fake:file:C:/families/Laurent.gigi"),
  );
  expect(JSON.parse(file ?? "null").name).toBe("Famille Laurent");
});

test("the name is required: OK is disabled when empty; Cancel and Escape create nothing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("prompt-ok")).toBeDisabled();
  await page.getByTestId("prompt-input").fill("   ");
  await expect(page.getByTestId("prompt-ok")).toBeDisabled();
  await page.getByTestId("prompt-cancel").click();
  await expect(page.getByTestId("prompt-dialog")).toHaveCount(0);
  await page.getByTestId("create").click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("prompt-dialog")).toHaveCount(0);
  await expect(page.getByTestId("create")).toBeVisible();
  expect(await defaultNames(page)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("fake:lastPath"))).toBeNull();
});

test("Enter in the field confirms", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("prompt-input").fill("Dubois");
  await page.getByTestId("prompt-input").press("Enter");
  await expect(page.getByTestId("family-name")).toHaveText("Dubois");
});

test("characters a file name cannot hold are replaced in the suggestion only", async ({ page }) => {
  await create(page, "Martin/Dupont: les cousins");
  await expect(page.getByTestId("family-name")).toHaveText("Martin/Dupont: les cousins");
  expect(await defaultNames(page)).toEqual(["Martin-Dupont- les cousins.gigi"]);
});

test("Rename changes the title and is remembered by Resume after a restart", async ({ page }) => {
  await create(page, "Laurent");
  await page.getByTestId("rename-family").click();
  await expect(page.getByTestId("prompt-input")).toHaveValue("Laurent");
  await page.getByTestId("prompt-input").fill("Laurent-Dubois");
  await page.getByTestId("prompt-ok").click();
  await expect(page.getByTestId("family-name")).toHaveText("Laurent-Dubois");

  await page.reload();
  await expect(page.getByTestId("resume")).toHaveText("Resume Laurent-Dubois");
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("family-name")).toHaveText("Laurent-Dubois");
});

test("a family without a name is titled by its file name", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "fake:file:C:/old/Grandpa.json",
      JSON.stringify({ schemaVersion: 1, people: [], relationships: [] }),
    );
    localStorage.setItem("fake:lastPath", "C:/old/Grandpa.json");
  });
  await page.goto("/");
  await expect(page.getByTestId("resume")).toHaveText("Resume Grandpa.json");
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("family-name")).toHaveText("Grandpa");
});

test("default export and share names are never translated; a shared page carries the family name", async ({
  page,
}) => {
  await create(page, "Laurent");
  for (const name of ["Paul", "Odile"]) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(name);
    await page.getByTestId("submit-person").click();
  }
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile" });
  await page.getByTestId("rel-add").click();

  await page.getByTestId("lang-fr").click();
  await page.getByTestId("export").click();
  await page.getByTestId("share").click();
  expect((await defaultNames(page)).slice(1)).toEqual(["family-export.gigi", "family.html"]);
  const html = await page.evaluate(() => localStorage.getItem("fake:file:C:/out/family.html"));
  expect(html).toContain("<title>Laurent</title>");
});

test("the prompt is in French in French", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("create").click();
  await expect(page.getByTestId("prompt-dialog")).toContainText(
    "Comment s'appelle cette famille ?",
  );
  await expect(page.getByTestId("prompt-input")).toHaveAttribute(
    "placeholder",
    "ex. Famille Laurent",
  );
  await expect(page.getByTestId("prompt-cancel")).toHaveText("Annuler");
});
