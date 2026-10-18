import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI; files live in localStorage as text under
// "fake:file:<path>". The open dialog returns "fake:importPath"; confirmations are recorded.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    let saveCalls = 0;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => read("fake:importPath"),
      saveFileDialog: async () => {
        saveCalls += 1;
        return saveCalls === 1 ? "C:/families/orig.json" : read("fake:exportPath");
      },
      confirm: async (message: string) => {
        localStorage.setItem("fake:lastConfirm", message);
        return read("fake:confirm") !== "no";
      },
      data: {
        exists: async (p: string) => read(`fake:file:${p}`) !== null,
        load: async (p: string) => JSON.parse(read(`fake:file:${p}`) ?? "null"),
        save: async (p: string, d: unknown) =>
          localStorage.setItem(`fake:file:${p}`, JSON.stringify(d, null, 2)),
        readRaw: async (p: string) => {
          const text = read(`fake:file:${p}`);
          if (text === null) throw new Error("missing file");
          return text;
        },
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

async function familyWithAda(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
}

/** Puts a family file with the given first names on the fake disk and selects it for import. */
async function stageImport(page: Page, firstNames: string[], path = "C:/in/other.json") {
  await page.evaluate(
    ([names, p]) => {
      const people = names.map((n, i) => ({
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        firstName: n,
        lastName: "",
      }));
      localStorage.setItem(
        `fake:file:${p}`,
        JSON.stringify({ schemaVersion: 1, people, relationships: [] }),
      );
      localStorage.setItem("fake:importPath", p!);
    },
    [firstNames, path] as const,
  );
}

const disk = (page: Page) =>
  page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("fake:file:"))
      .map((k) => k.slice("fake:file:".length)),
  );

test("import replaces the family after a confirmation, with a dated and hashed backup", async ({
  page,
}) => {
  await familyWithAda(page);
  await stageImport(page, ["Zed", "Yan"]);
  await page.getByTestId("import").click();

  await expect(page.getByTestId("notice")).toContainText("Imported other.json: 2 people");
  await expect(page.getByTestId("person-row")).toHaveCount(2);
  const confirm = await page.evaluate(() => localStorage.getItem("fake:lastConfirm"));
  expect(confirm).toContain("REPLACED");
  expect(confirm).toContain("1 person");
  expect(confirm).toContain("2 people");

  const backups = (await disk(page)).filter((p) => p.includes(".backup-"));
  expect(backups).toHaveLength(1);
  expect(backups[0]).toMatch(/^C:\/families\/orig\.backup-\d{8}-\d{6}-[0-9a-f]{8}\.json$/);
  const saved = await page.evaluate((p) => localStorage.getItem(`fake:file:${p}`), backups[0]!);
  expect(JSON.parse(saved ?? "null").people).toHaveLength(1);
});

test("declining the confirmation changes nothing and writes no backup", async ({ page }) => {
  await familyWithAda(page);
  await stageImport(page, ["Zed", "Yan"]);
  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("import").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("notice")).toHaveCount(0);
  expect((await disk(page)).filter((p) => p.includes(".backup-"))).toHaveLength(0);
});

test("an invalid file shows an error and keeps the family", async ({ page }) => {
  await familyWithAda(page);
  await page.evaluate(() => {
    localStorage.setItem("fake:file:C:/in/bad.json", "{nope");
    localStorage.setItem("fake:importPath", "C:/in/bad.json");
  });
  await page.getByTestId("import").click();
  await expect(page.getByTestId("error")).toContainText("not valid JSON");
  await expect(page.getByTestId("person-row")).toHaveCount(1);
});

test("skipped items are listed after the import", async ({ page }) => {
  await familyWithAda(page);
  await page.evaluate(() => {
    const id = "00000000-0000-4000-8000-000000000001";
    localStorage.setItem(
      "fake:file:C:/in/dmg.json",
      JSON.stringify({
        schemaVersion: 1,
        people: [{ id, firstName: "Zed", lastName: "" }],
        relationships: [
          {
            id: "00000000-0000-4000-8000-000000000009",
            type: "partner",
            personAId: id,
            personBId: "00000000-0000-4000-8000-0000000000ff",
            status: "ongoing",
          },
        ],
      }),
    );
    localStorage.setItem("fake:importPath", "C:/in/dmg.json");
  });
  await page.getByTestId("import").click();
  await expect(page.getByTestId("import-warnings")).toContainText("1 relationships were skipped");
});

test("close family goes back to the welcome screen, which offers to resume", async ({ page }) => {
  await familyWithAda(page);
  await page.getByTestId("close-family").click();
  await expect(page.getByTestId("create")).toBeVisible();
  await expect(page.getByTestId("resume")).toBeVisible();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
});
