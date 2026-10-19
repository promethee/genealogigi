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
      confirm: async (message: string) => {
        const asked = JSON.parse(read("fake:asked") ?? "[]") as string[];
        asked.push(message);
        localStorage.setItem("fake:asked", JSON.stringify(asked));
        return read("fake:confirm") !== "no";
      },
      pickImages: async () => JSON.parse(read("fake:pick") ?? "[]"),
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

const asked = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("fake:asked") ?? "[]") as string[]);
const answer = (page: Page, yes: boolean) =>
  page.evaluate((v) => localStorage.setItem("fake:confirm", v ? "yes" : "no"), yes);

async function person(page: Page, first: string, born?: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  if (born) await page.getByTestId("birth-year").fill(born);
  await page.getByTestId("submit-person").click();
}

async function family(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await person(page, "Mum", "1950");
  await person(page, "Dad", "1948");
  await person(page, "Kid", "1980");
  await page.getByTestId("rel-second").selectOption({ label: "Kid" });
  await page.getByTestId("rel-first").selectOption({ label: "Mum" });
  await page.getByTestId("rel-parent-b").selectOption({ label: "Dad" });
  await page.getByTestId("rel-add").click();
}

const open = (page: Page, name: string) =>
  page
    .getByTestId("person-name")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();

test("'Child born' says 'with' the child's other parent, never the child", async ({ page }) => {
  await family(page);
  await open(page, "Mum");
  const entry = page.getByTestId("timeline-entry").filter({ hasText: "Child born: Kid" });
  await expect(entry.getByTestId("timeline-person")).toHaveText(["Dad"]);
  await expect(entry).toContainText("with Dad");
  await expect(entry.getByTestId("timeline-person").filter({ hasText: "Kid" })).toHaveCount(0);
  // Following the link goes to the other parent.
  await entry.getByTestId("timeline-person").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Dad");
});

test("a child with only one known parent has no 'with'", async ({ page }) => {
  await family(page);
  await page.getByTestId("lang-en").click();
  // Remove Dad's link to Kid so Mum is the only parent.
  const rows = page.getByTestId("relationship-row").filter({ hasText: "Dad is parent of Kid" });
  await rows.getByTestId("delete-relationship").click();
  await open(page, "Mum");
  const entry = page.getByTestId("timeline-entry").filter({ hasText: "Child born: Kid" });
  await expect(entry).toBeVisible();
  await expect(entry.getByTestId("timeline-person")).toHaveCount(0);
  await expect(entry).not.toContainText("with");
});

test("the Close button is at the bottom right of the person card", async ({ page }) => {
  await family(page);
  await open(page, "Mum");
  const card = (await page.getByTestId("person-card").boundingBox())!;
  const close = (await page.getByTestId("detail-close").boundingBox())!;
  const edit = (await page.getByTestId("detail-edit").boundingBox())!;
  // Lower right: within the bottom 90 px and the right 150 px of the card, below Edit.
  expect(close.y + close.height).toBeGreaterThan(card.y + card.height - 90);
  expect(close.x + close.width).toBeGreaterThan(card.x + card.width - 150);
  expect(close.y).toBeGreaterThan(edit.y + edit.height);
  // Nothing else in the header is called Close.
  await expect(page.getByTestId("detail-close")).toHaveCount(1);
  await page.getByTestId("detail-close").click();
  await expect(page.getByTestId("person-card")).toHaveCount(0);
});

test("the Close button is also at the bottom of the card in the tree tab", async ({ page }) => {
  await family(page);
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-root").selectOption({ label: "Kid" });
  await page.getByTestId("tree-node").filter({ hasText: /^Mum/ }).click();
  const panel = (await page.getByTestId("tree-detail-panel").boundingBox())!;
  const close = (await page.getByTestId("detail-close").boundingBox())!;
  expect(close.y + close.height).toBeGreaterThan(panel.y + panel.height - 90);
  expect(close.x + close.width).toBeGreaterThan(panel.x + panel.width - 150);
});

test("'Baptism' is not offered when adding an event", async ({ page }) => {
  await family(page);
  await open(page, "Mum");
  await page.getByTestId("event-add").click();
  const options = await page.getByTestId("event-kind").locator("option").allTextContents();
  expect(options).not.toContain("Baptism");
  expect(options).toEqual([
    "Marriage",
    "Divorce",
    "Residence",
    "Occupation",
    "Education",
    "Military service",
    "Emigration",
    "Immigration",
    "Other",
  ]);
  await page.getByTestId("lang-fr").click();
  expect(await page.getByTestId("event-kind").locator("option").allTextContents()).not.toContain(
    "Baptême",
  );
});

test("an old baptism event still shows and can be edited", async ({ page }) => {
  await family(page);
  // Simulate a file saved before baptism was removed.
  await page.evaluate(() => {
    const key = "fake:file:C:/families/names.json";
    const file = JSON.parse(localStorage.getItem(key)!);
    file.events = [
      {
        id: "33333333-3333-4333-8333-333333333333",
        kind: "baptism",
        date: {
          raw: "1950-04-01T00:00",
          yearKnown: true,
          monthKnown: false,
          dayKnown: false,
          hourKnown: false,
          minuteKnown: false,
        },
        personIds: [file.people[0].id],
      },
    ];
    localStorage.setItem(key, JSON.stringify(file));
  });
  await page.reload();
  await page.getByTestId("resume").click();
  await page.getByTestId("tab-list").click(); // a family with relationships opens on the tree
  await open(page, "Mum");
  await expect(page.getByTestId("timeline-text").filter({ hasText: "Baptism" })).toBeVisible();
  await page.getByTestId("event-edit").click();
  await expect(page.getByTestId("event-kind")).toHaveValue("baptism");
  await page.getByTestId("event-kind").selectOption("marriage");
  await page.getByTestId("event-save").click();
  await expect(page.getByTestId("timeline-text").filter({ hasText: "Baptism" })).toHaveCount(0);
  await expect(page.getByTestId("timeline-text").filter({ hasText: "Marriage" })).toBeVisible();
});

test.describe("every Delete asks for confirmation first", () => {
  test("person (list card)", async ({ page }) => {
    await family(page);
    await open(page, "Kid");
    await answer(page, false);
    await page.getByTestId("detail-delete").click();
    expect((await asked(page)).length).toBe(1);
    expect((await asked(page))[0]).toContain("Kid");
    await expect(page.getByTestId("person-row")).toHaveCount(3);
    await answer(page, true);
    await page.getByTestId("detail-delete").click();
    expect((await asked(page)).length).toBe(2);
    await expect(page.getByTestId("person-row")).toHaveCount(2);
  });

  test("person (tree card)", async ({ page }) => {
    await family(page);
    await page.getByTestId("tab-tree").click();
    await page.getByTestId("tree-root").selectOption({ label: "Kid" });
    await page.getByTestId("tree-node").filter({ hasText: /^Mum/ }).click();
    await answer(page, false);
    await page.getByTestId("detail-delete").click();
    expect((await asked(page)).length).toBe(1);
    await expect(page.getByTestId("tree-node").filter({ hasText: /^Mum/ })).toHaveCount(1);
    await answer(page, true);
    await page.getByTestId("detail-delete").click();
    expect((await asked(page)).length).toBe(2);
    await expect(page.getByTestId("tree-node").filter({ hasText: /^Mum/ })).toHaveCount(0);
  });

  test("relationship", async ({ page }) => {
    await family(page);
    await answer(page, false);
    await page.getByTestId("delete-relationship").first().click();
    expect((await asked(page)).length).toBe(1);
    await expect(page.getByTestId("relationship-row")).toHaveCount(2);
    await answer(page, true);
    await page.getByTestId("delete-relationship").first().click();
    expect((await asked(page)).length).toBe(2);
    await expect(page.getByTestId("relationship-row")).toHaveCount(1);
  });

  test("event", async ({ page }) => {
    await family(page);
    await open(page, "Mum");
    await page.getByTestId("event-add").click();
    await page.getByTestId("event-kind").selectOption("residence");
    await page.getByTestId("event-date-year").fill("1990");
    await page.getByTestId("event-save").click();
    await answer(page, false);
    await page.getByTestId("event-delete").click();
    expect((await asked(page)).length).toBe(1);
    await expect(page.getByTestId("event-delete")).toHaveCount(1);
    await answer(page, true);
    await page.getByTestId("event-delete").click();
    expect((await asked(page)).length).toBe(2);
    await expect(page.getByTestId("event-delete")).toHaveCount(0);
  });

  test("photo", async ({ page }) => {
    await family(page);
    await open(page, "Mum");
    const dataUrl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = c.height = 100;
      c.getContext("2d")!.fillRect(0, 0, 100, 100);
      return c.toDataURL("image/png");
    });
    await page.evaluate(
      (json) => localStorage.setItem("fake:pick", json),
      JSON.stringify([{ name: "a.png", dataUrl }]),
    );
    await page.getByTestId("photo-add").click();
    await page.getByTestId("photo-thumb").click();
    await answer(page, false);
    await page.getByTestId("viewer-remove").click();
    expect((await asked(page)).length).toBe(1);
    await expect(page.getByTestId("photo-viewer")).toBeVisible();
    await answer(page, true);
    await page.getByTestId("viewer-remove").click();
    expect((await asked(page)).length).toBe(2);
    await expect(page.getByTestId("photo-thumb")).toHaveCount(0);
  });

  test("the question is asked in the active language", async ({ page }) => {
    await family(page);
    await open(page, "Kid");
    await page.getByTestId("lang-fr").click();
    await answer(page, false);
    await page.getByTestId("detail-delete").click();
    expect((await asked(page))[0]).toContain("Supprimer");
  });
});
