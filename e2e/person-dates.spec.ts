import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/dates.json",
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

interface Dates {
  birth?: [string, string, string]; // year, month number, day
  death?: [string, string, string];
  status?: "unknown" | "living" | "deceased";
}

async function fillDates(page: Page, dates: Dates): Promise<void> {
  if (dates.birth) {
    await page.getByTestId("birth-year").fill(dates.birth[0]);
    await page.getByTestId("birth-month").selectOption(dates.birth[1]);
    await page.getByTestId("birth-day").fill(dates.birth[2]);
  }
  if (dates.status) await page.getByTestId("life-status").selectOption(dates.status);
  if (dates.death) {
    await page.getByTestId("death-year").fill(dates.death[0]);
    await page.getByTestId("death-month").selectOption(dates.death[1]);
    await page.getByTestId("death-day").fill(dates.death[2]);
  }
}

async function addPerson(page: Page, first: string, dates: Dates = {}): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await fillDates(page, dates);
  await page.getByTestId("submit-person").click();
}

async function newFamily(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
}

test("saves birth, deceased status and death date, and shows a summary", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada", {
    birth: ["1815", "12", "10"],
    status: "deceased",
    death: ["1852", "11", "27"],
  });
  await expect(page.getByTestId("person-life")).toHaveText("born 10 Dec 1815 · died 27 Nov 1852");
});

test("accepts a partial date and a living person", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Byron", { status: "living" });
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Carl");
  await page.getByTestId("birth-year").fill("1990");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-life")).toHaveText(["living", "born 1990 · living"]);
});

test("rejects a day without a month, an impossible day and death before birth", async ({
  page,
}) => {
  await newFamily(page);

  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
  await page.getByTestId("birth-day").fill("10");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toContainText("A day needs a month");

  await page.getByTestId("birth-year").fill("1815");
  await page.getByTestId("birth-month").selectOption("4");
  await page.getByTestId("birth-day").fill("31");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toContainText("does not exist in that month");

  await page.getByTestId("birth-day").fill("10");
  await page.getByTestId("life-status").selectOption("deceased");
  await page.getByTestId("death-year").fill("1800");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toHaveText("Death cannot be before birth.");

  await page.getByTestId("cancel-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(0);
});

test("editing shows the saved dates and keeps them after a restart", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada", { birth: ["1815", "12", "10"], status: "living" });

  await page.getByTestId("view-person").click();
  await page.getByTestId("detail-edit").click();
  await expect(page.getByTestId("birth-year")).toHaveValue("1815");
  await expect(page.getByTestId("birth-month")).toHaveValue("12");
  await expect(page.getByTestId("birth-day")).toHaveValue("10");
  await expect(page.getByTestId("life-status")).toHaveValue("living");
  await page.getByTestId("life-status").selectOption("deceased");
  await page.getByTestId("death-year").fill("1852");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-life")).toHaveText("born 10 Dec 1815 · died 1852");

  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("person-life")).toHaveText("born 10 Dec 1815 · died 1852");
});

test("the tree shows a lifespan under names that have dates", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada", {
    birth: ["1815", "12", "10"],
    status: "deceased",
    death: ["1852", "11", "27"],
  });
  await addPerson(page, "Byron");
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-root").selectOption({ label: "Ada" });
  await expect(page.getByTestId("tree-lifespan")).toHaveText("1815–1852");
  await page.getByTestId("tree-root").selectOption({ label: "Byron" });
  await expect(page.getByTestId("tree-lifespan")).toHaveCount(0);
});
