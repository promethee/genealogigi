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

async function person(
  page: Page,
  first: string,
  extra: { last?: string; born?: string; place?: string; died?: string } = {},
): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").first().fill(first);
  if (extra.last) await page.getByTestId("last-name").first().fill(extra.last);
  if (extra.born) await page.getByTestId("birth-year").fill(extra.born);
  if (extra.place) await page.getByTestId("birth-place").fill(extra.place);
  if (extra.died) {
    await page.getByTestId("life-status").selectOption("deceased");
    await page.getByTestId("death-year").fill(extra.died);
  }
  await page.getByTestId("submit-person").click();
}

async function open(page: Page, name: string): Promise<void> {
  await page.getByTestId("person-name").filter({ hasText: name }).first().click();
}

async function start(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await person(page, "Marie", { last: "Martin", born: "1950", place: "Lyon", died: "2020" });
  await person(page, "Paul", { last: "Girard", born: "1948" });
}

const texts = (page: Page) => page.getByTestId("timeline-text").allTextContents();

test("a new card shows birth and death in order, plus an Add event button", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await expect(page.getByTestId("timeline")).toBeVisible();
  expect(await texts(page)).toEqual(["Born in Lyon", "Died"]);
  await expect(page.getByTestId("event-add")).toBeVisible();
  // Derived entries cannot be edited or deleted from the timeline.
  await expect(page.getByTestId("event-edit")).toHaveCount(0);
  await expect(page.getByTestId("event-delete")).toHaveCount(0);
});

test("a person with nothing recorded says so", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await person(page, "Solo");
  await open(page, "Solo");
  await expect(page.getByTestId("timeline-empty")).toBeVisible();
});

test("adds a marriage with another person; it is on both timelines, in order", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("event-add").click();
  await page.getByTestId("event-kind").selectOption("marriage");
  await page.getByTestId("event-date-year").fill("1975");
  await page.getByTestId("event-place").fill("Lyon");
  await page.getByTestId("event-add-person").selectOption({ label: "Paul Girard" });
  await expect(page.getByTestId("event-person")).toContainText("Paul Girard");
  await page.getByTestId("event-save").click();

  expect(await texts(page)).toEqual(["Born in Lyon", "Marriage in Lyon", "Died"]);
  await expect(page.getByTestId("timeline-date").nth(1)).toHaveText("1975");
  await expect(page.getByTestId("timeline-person")).toHaveText("Paul Girard");

  // Follow the link: Paul's timeline shows the same event, linking back to Marie.
  await page.getByTestId("timeline-person").click();
  await expect(page.getByTestId("detail-name")).toHaveText("Paul Girard");
  expect(await texts(page)).toEqual(["Born", "Marriage in Lyon"]);
  await expect(page.getByTestId("timeline-person")).toContainText("Marie");
});

test("the event survives a restart", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("event-add").click();
  await page.getByTestId("event-kind").selectOption("education");
  await page.getByTestId("event-date-year").fill("1950");
  await page.getByTestId("event-save").click();
  await page.reload();
  await page.getByTestId("resume").click();
  await open(page, "Marie");
  expect(await texts(page)).toContain("Education");
});

test("type Other needs a description; future dates are rejected", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("event-add").click();
  await page.getByTestId("event-kind").selectOption("other");
  await page.getByTestId("event-save").click();
  await expect(page.getByTestId("error")).toContainText("description is required");

  await page.getByTestId("event-description").fill("Won a prize");
  await page.getByTestId("event-date-year").fill(String(new Date().getFullYear() + 1));
  await page.getByTestId("event-save").click();
  await expect(page.getByTestId("error")).toContainText("cannot be in the future");

  await page.getByTestId("event-date-year").fill("1990");
  await page.getByTestId("event-save").click();
  expect(await texts(page)).toContain("Won a prize");
});

test("edit and delete a user event; delete asks for confirmation", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("event-add").click();
  await page.getByTestId("event-kind").selectOption("residence");
  await page.getByTestId("event-date-year").fill("1980");
  await page.getByTestId("event-place").fill("Paris");
  await page.getByTestId("event-save").click();
  expect(await texts(page)).toContain("Residence in Paris");

  await page.getByTestId("event-edit").click();
  await expect(page.getByTestId("event-place")).toHaveValue("Paris");
  await page.getByTestId("event-place").fill("Nantes");
  await page.getByTestId("event-save").click();
  expect(await texts(page)).toContain("Residence in Nantes");

  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("event-delete").click();
  expect(await texts(page)).toContain("Residence in Nantes");
  await page.evaluate(() => localStorage.setItem("fake:confirm", "yes"));
  await page.getByTestId("event-delete").click();
  expect(await texts(page)).not.toContain("Residence in Nantes");
});

test("the person cannot be added to their own event, nor twice", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("event-add").click();
  const options = await page.getByTestId("event-add-person").locator("option").allTextContents();
  expect(options.join("|")).not.toContain("Marie");
  await page.getByTestId("event-add-person").selectOption({ label: "Paul Girard" });
  // Paul is now a chip and no longer offered.
  await expect(page.getByTestId("event-add-person")).toHaveCount(0);
  await page.getByTestId("event-person-remove").click();
  await expect(page.getByTestId("event-add-person")).toBeVisible();
});

test("names with dates, children and partnerships appear on the timeline", async ({ page }) => {
  await start(page);
  await person(page, "Kid", { born: "1980" });
  // Marie took a married name in 1975.
  await open(page, "Marie");
  await page.getByTestId("detail-edit").click();
  await page.getByTestId("add-last-name").click();
  await page.getByTestId("last-name").nth(1).fill("Girard");
  await page.getByTestId("last-name-year").nth(1).fill("1975");
  await page.getByTestId("submit-person").click();
  // Marie is a parent of Kid; Marie and Paul have a partnership starting in 1972.
  await page.getByTestId("detail-close").click();
  await page.getByTestId("rel-child").selectOption({ label: "Kid" });
  await page.getByTestId("rel-parent-a").selectOption({ label: "Marie Girard (née Martin)" });
  await page
    .getByTestId("rel-add")
    .click()
    .catch(() => {});
  await page
    .getByTestId("error")
    .waitFor({ state: "visible" })
    .catch(() => {});
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Marie Girard (née Martin)" });
  await page.getByTestId("rel-second").selectOption({ label: "Kid" });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Marie Girard (née Martin)" });
  await page.getByTestId("rel-second").selectOption({ label: "Paul Girard" });
  await page.getByTestId("rel-start-year").fill("1972");
  await page.getByTestId("rel-add").click();

  await open(page, "Marie");
  expect(await texts(page)).toEqual([
    "Born in Lyon",
    "Partnership with Paul Girard began",
    "Name: Girard (married)",
    "Child born: Kid",
    "Died",
  ]);
});

test("French timeline and form", async ({ page }) => {
  await start(page);
  await open(page, "Marie");
  await page.getByTestId("lang-fr").click();
  expect(await texts(page)).toEqual(["Naissance à Lyon", "Décès"]);
  await page.getByTestId("event-add").click();
  await expect(page.getByTestId("event-kind")).toContainText("Mariage");
  await expect(page.getByTestId("event-save")).toHaveText("Enregistrer");
});
