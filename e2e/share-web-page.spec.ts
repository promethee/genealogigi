import { expect, test, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

test("Share is disabled until there are two people and one relationship", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  const share = page.getByTestId("share");
  await expect(share).toBeDisabled(); // nobody yet
  await expect(share).toHaveAttribute("title", /at least two people and one relationship/);

  await addPerson(page, "Paul", "Laurent");
  await expect(share).toBeDisabled(); // one person
  await addPerson(page, "Odile", "Laurent");
  await expect(share).toBeDisabled(); // two people, no relationship

  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile Laurent" });
  await page.getByTestId("rel-add").click();
  await expect(share).toBeEnabled();
  await expect(share).not.toHaveAttribute("title", /./);

  // Deleting the only relationship disables it again.
  await page.getByTestId("delete-relationship").click();
  await expect(share).toBeDisabled();
});

test("French explains why Share is disabled", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("share")).toHaveAttribute(
    "title",
    "Ajoutez au moins deux personnes et un lien de parenté pour partager la famille.",
  );
});

test("declining the warning writes nothing; the warning says everyone is included", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Paul", "Laurent");
  await addPerson(page, "Odile", "Laurent");
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile Laurent" });
  await page.getByTestId("rel-add").click();
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
  await expect(viewer.locator("#list")).toContainText('<img Src=x Onerror="window.__pwned=1">'); // shown as text (name case applied)
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
  await addPerson(page, "Odile", "Laurent");
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile Laurent" });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("share").click();
  const html = await page.evaluate(() => localStorage.getItem("fake:file:C:/share/page.html"));
  expect(html).toContain('<html lang="fr">');
  expect(html).toContain("Partagé depuis Genealogigi");
  const dir = mkdtempSync(join(tmpdir(), "gigi-share-"));
  writeFileSync(join(dir, "p.html"), html!);
  const viewer = await browser.newPage();
  await viewer.goto(`file://${join(dir, "p.html")}`);
  await expect(viewer.locator("#count")).toHaveText("2 personnes");
  await viewer.close();
});

test("the exported page has a Tree view with everyone; a box opens that person", async ({
  page,
  browser,
}) => {
  const url = await buildAndShare(page);
  const viewer = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await viewer.goto(url);
  await expect(viewer.locator("#views")).toContainText("Tree");
  await viewer.locator("#v-tree").click();
  expect(viewer.url()).toContain("#tree");
  await expect(viewer.locator("#treeview")).toBeVisible();
  await expect(viewer.locator("main")).toBeHidden();
  await expect(viewer.locator("#treesvg .tn")).toHaveCount(3); // everyone, once
  await expect(viewer.locator("#treesvg .te")).toHaveCount(1); // Paul is Odile's parent
  await viewer.locator("#treesvg .tn", { hasText: "Odile" }).click();
  await expect(viewer.locator("#card h2")).toHaveText("Odile Laurent");
  await expect(viewer.locator("#treeview")).toBeHidden();
  await viewer.locator("#v-tree").click();
  await expect(viewer.locator("#treesvg .tn.cur")).toContainText("Odile"); // the open person is marked
  await viewer.close();
});

test("the Tree view shows partners in their own colour and fits the window", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByTestId("create").click();
  await addPerson(page, "Paul", "Laurent");
  await addPerson(page, "Odile", "Laurent");
  await page.getByTestId("rel-kind").selectOption("partner");
  await page.getByTestId("rel-first").selectOption({ label: "Paul Laurent" });
  await page.getByTestId("rel-second").selectOption({ label: "Odile Laurent" });
  await page.getByTestId("rel-add").click();
  await page.getByTestId("share").click();
  const html = await page.evaluate(() => localStorage.getItem("fake:file:C:/share/page.html"));
  const dir = mkdtempSync(join(tmpdir(), "gigi-share-"));
  writeFileSync(join(dir, "page.html"), html!);
  const viewer = await browser.newPage({ viewport: { width: 300, height: 800 } });
  await viewer.goto(`file://${join(dir, "page.html")}#tree`);
  await expect(viewer.locator("#treesvg .tp")).toHaveCount(1);
  const stroke = (sel: string) =>
    viewer
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
  expect(await stroke("#treesvg .tp")).not.toBe(await stroke("#treesvg .tn rect"));
  const fitted = await viewer
    .locator("#treesvg")
    .evaluate((el) => Number(el.getAttribute("width")));
  expect(fitted).toBeLessThanOrEqual(300);
  await viewer.locator("#actual").click();
  const actual = await viewer
    .locator("#treesvg")
    .evaluate((el) => Number(el.getAttribute("width")));
  expect(actual).toBeGreaterThan(fitted);
  await viewer.locator("#fit").click();
  expect(await viewer.locator("#treesvg").evaluate((el) => Number(el.getAttribute("width")))).toBe(
    fitted,
  );
  await viewer.close();
});

test("the Tree view shows a person's portrait in their box, initials otherwise", async ({
  page,
  browser,
}) => {
  const url = await buildAndShare(page);
  const file = url.replace("file://", "");
  const html = readFileSync(file, "utf8");
  const open = '<script type="application/json" id="data">';
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf("</script>", start);
  const model = JSON.parse(html.slice(start, end));
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  model.people.find((p: { name: string }) => p.name === "Odile Laurent").photos = [
    { src: png, caption: "" },
  ];
  writeFileSync(
    file,
    html.slice(0, start) + JSON.stringify(model).replaceAll("<", "\\u003c") + html.slice(end),
  );
  const viewer = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await viewer.goto(`${url}#tree`);
  const odile = viewer.locator("#treesvg .tn", { hasText: "Odile" });
  await expect(odile.locator("image.pic")).toHaveCount(1);
  await expect(odile.locator("text").filter({ hasText: /^OL$/ })).toHaveCount(0); // no initials
  const paul = viewer.locator("#treesvg .tn", { hasText: "Paul" });
  await expect(paul.locator("image.pic")).toHaveCount(0);
  await expect(paul.locator("text").filter({ hasText: /^PL$/ })).toHaveCount(1);
  await viewer.close();
});

test("the Tree view is centred in its frame when it is narrower than the window", async ({
  page,
  browser,
}) => {
  const url = await buildAndShare(page);
  const viewer = await browser.newPage({ viewport: { width: 1600, height: 800 } });
  await viewer.goto(`${url}#tree`);
  const box = (await viewer.locator("#treebox").boundingBox())!;
  const svg = (await viewer.locator("#treesvg").boundingBox())!;
  expect(svg.width).toBeLessThan(box.width - 40); // a small family in a wide frame
  const left = svg.x - box.x;
  const right = box.x + box.width - (svg.x + svg.width);
  expect(Math.abs(left - right)).toBeLessThan(4);
  await viewer.close();
});
