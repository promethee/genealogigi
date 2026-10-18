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

async function openForm(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill("Ada");
}

test("the birth year shows a grey example 30 years back and saves nothing by itself", async ({
  page,
}) => {
  await openForm(page);
  const year = new Date().getFullYear() - 30;
  await expect(page.getByTestId("birth-year")).toHaveAttribute("placeholder", `e.g. ${year}`);
  await expect(page.getByTestId("birth-year")).toHaveValue("");
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-life")).toHaveText("living"); // no "born …"
  const file = await page.evaluate(() => localStorage.getItem("fake:file:C:/families/names.json"));
  expect(JSON.parse(file ?? "null").people[0].born).toBeUndefined();
});

test("the example follows the language", async ({ page }) => {
  await openForm(page);
  await page.getByTestId("lang-fr").click();
  const year = new Date().getFullYear() - 30;
  await expect(page.getByTestId("birth-year")).toHaveAttribute("placeholder", `ex. ${year}`);
});

test("a birth date in the future is rejected, this year alone is fine", async ({ page }) => {
  await openForm(page);
  const year = new Date().getFullYear();
  await page.getByTestId("birth-year").fill(String(year + 1));
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toHaveText("Birth date cannot be in the future.");
  await expect(page.getByTestId("person-row")).toHaveCount(0);

  await page.getByTestId("birth-year").fill(String(year));
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
});

test("a death date in the future is rejected", async ({ page }) => {
  await openForm(page);
  await page.getByTestId("birth-year").fill("1950");
  await page.getByTestId("life-status").selectOption("deceased");
  await page.getByTestId("death-year").fill(String(new Date().getFullYear() + 2));
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toHaveText("Death date cannot be in the future.");
});

test("the future-date error is French in French", async ({ page }) => {
  await openForm(page);
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("birth-year").fill(String(new Date().getFullYear() + 1));
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("error")).toHaveText(
    "Date de naissance : la date ne peut pas être dans le futur.",
  );
});
