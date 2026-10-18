import { expect, test, type Page } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The fake shell keeps files as text in localStorage; the exported page is then opened for real.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    let saveCalls = 0;
    (window as unknown as Record<string, unknown>).__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => {
        saveCalls += 1;
        return saveCalls === 1 ? "C:/families/laurent.gigi" : "C:/share/page.html";
      },
      confirm: async (message: string) => {
        localStorage.setItem("fake:lastConfirm", message);
        return read("fake:confirm") !== "no";
      },
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

async function addPerson(page: Page, first: string, last: string, notes = ""): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("last-name").fill(last);
  if (notes) await page.getByTestId("notes").fill(notes);
  await page.getByTestId("submit-person").click();
  await expect(page.getByTestId("person-row")).toHaveCount(
    await page.getByTestId("person-row").count(),
  );
}

async function buildAndShare(page: Page): Promise<string> {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Paul", "Laurent", "Baker on Rue Victor Hugo.\nLoved chess.");
  await addPerson(page, "Odile", "Laurent");
  await addPerson(page, '<img src=x onerror="window.__pwned=1">', "Evil");
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile Laurent" });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("share").click();
  await expect(page.getByTestId("notice")).toContainText("Web page saved to C:/share/page.html");
  const html = await page.evaluate(() => localStorage.getItem("fake:file:C:/share/page.html"));
  expect(html).toBeTruthy();
  const dir = mkdtempSync(join(tmpdir(), "gigi-share-"));
  const file = join(dir, "page.html");
  writeFileSync(file, html!);
  return `file://${file}`;
}

test("declining the warning writes nothing; the warning says everyone is included", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Paul", "Laurent");
  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("share").click();
  const message = await page.evaluate(() => localStorage.getItem("fake:lastConfirm"));
  expect(message).toContain("EVERYONE");
  expect(
    await page.evaluate(() => localStorage.getItem("fake:file:C:/share/page.html")),
  ).toBeNull();
  await expect(page.getByTestId("notice")).toHaveCount(0);
});

test("the exported page lists people, searches, and follows relatives", async ({
  page,
  browser,
}) => {
  const url = await buildAndShare(page);
  const viewer = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const requests: string[] = [];
  viewer.on("request", (r) => requests.push(r.url()));
  await viewer.goto(url);

  await expect(viewer.locator("#count")).toHaveText("3 people");
  await expect(viewer.locator("#list button")).toHaveCount(3);

  await viewer.locator("#search").fill("victor");
  await expect(viewer.locator("#list button")).toHaveCount(1); // found through the note
  await viewer.locator("#list button").click();
  await expect(viewer.locator("#card h2")).toHaveText("Paul Laurent");
  await expect(viewer.locator("#card .notes")).toContainText("Loved chess.");
  await expect(viewer.locator("#card h3").filter({ hasText: "Children" })).toBeVisible();

  await viewer.locator("#card a.rel", { hasText: "Odile Laurent" }).click();
  await expect(viewer.locator("#card h2")).toHaveText("Odile Laurent");
  await expect(viewer.locator("#card h3").filter({ hasText: "Parents" })).toBeVisible();
  expect(viewer.url()).toContain("#p=");
  await viewer.goBack();
  await expect(viewer.locator("#card h2")).toHaveText("Paul Laurent");

  // Nothing but the file itself was loaded: the page works offline.
  expect(requests.every((u) => u.startsWith("file:") || u.startsWith("data:"))).toBe(true);
  await viewer.close();
});

test("hostile text in a name is shown as text and never runs", async ({ page, browser }) => {
  const url = await buildAndShare(page);
  const viewer = await browser.newPage();
  await viewer.goto(url);
  await expect(viewer.locator("#list")).toContainText('<img src=x onerror="window.__pwned=1">');
  await viewer.locator("#list button", { hasText: "Evil" }).click();
  await expect(viewer.locator("#card h2")).toContainText("<img");
  expect(
    await viewer.evaluate(() => (window as unknown as { __pwned?: number }).__pwned),
  ).toBeUndefined();
  expect(await viewer.locator("#card img[src='x']").count()).toBe(0);
  await viewer.close();
});

test("on a phone the list and the card alternate, with a Back button", async ({
  page,
  browser,
}) => {
  const url = await buildAndShare(page);
  const viewer = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await viewer.goto(url);
  await expect(viewer.locator("#cardpanel")).toBeHidden();
  await viewer.locator("#list button").first().click();
  await expect(viewer.locator("#listpanel")).toBeHidden();
  await viewer.locator("#back").click();
  await expect(viewer.locator("#listpanel")).toBeVisible();
  await viewer.close();
});

test("the page is written in the app's language", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByTestId("lang-fr").click();
  await page.getByTestId("create").click();
  await addPerson(page, "Paul", "Laurent");
  await page.getByTestId("share").click();
  const html = await page.evaluate(() => localStorage.getItem("fake:file:C:/share/page.html"));
  expect(html).toContain('<html lang="fr">');
  expect(html).toContain("Partagé depuis Genealogigi");
  const dir = mkdtempSync(join(tmpdir(), "gigi-share-"));
  writeFileSync(join(dir, "p.html"), html!);
  const viewer = await browser.newPage();
  await viewer.goto(`file://${join(dir, "p.html")}`);
  await expect(viewer.locator("#count")).toHaveText("1 personne");
  await viewer.close();
});
