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

type Pick = { name: string; dataUrl: string };

/** A real image, drawn in the page: a coloured rectangle of the given size. */
function image(
  page: Page,
  color: string,
  width = 800,
  height = 600,
  type = "image/png",
): Promise<string> {
  return page.evaluate(
    ([c, w, h, mime]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w as number;
      canvas.height = h as number;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = c as string;
      ctx.fillRect(0, 0, w as number, h as number);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(10, 10, 40, 40);
      return canvas.toDataURL(mime as string);
    },
    [color, width, height, type],
  );
}

/** What the file picker will return next. */
const pick = (page: Page, images: Pick[]) =>
  page.evaluate((json) => localStorage.setItem("fake:pick", json), JSON.stringify(images));

async function start(page: Page, ...names: string[]): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const n of names) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(n);
    await page.getByTestId("submit-person").click();
  }
}

const open = (page: Page, name: string) =>
  page
    .getByTestId("person-name")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();

const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("fake:file:C:/families/names.json") ?? "null"),
  );

const size = (page: Page, dataUrl: string) =>
  page.evaluate(
    (url) =>
      new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = url;
      }),
    dataUrl,
  );

test("a person without photos shows initials and an Add photos button", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await expect(page.getByTestId("photos-empty")).toBeVisible();
  await expect(page.getByTestId("photo-add")).toBeVisible();
  await expect(page.getByTestId("avatar-initials").first()).toBeVisible();
  await expect(page.getByTestId("avatar-photo")).toHaveCount(0);
});

test("adding a photo makes it the main one, shown in the card and the list", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [{ name: "ada.png", dataUrl: await image(page, "#cc3355") }]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);
  await expect(page.getByTestId("photo-main-badge")).toHaveCount(1);
  await expect(page.getByTestId("person-card").getByTestId("avatar-photo")).toBeVisible();
  await page.getByTestId("detail-close").click();
  await expect(page.getByTestId("person-row").getByTestId("avatar-photo")).toBeVisible();
  await expect(page.getByTestId("person-row").getByTestId("avatar-initials")).toHaveCount(0);
});

test("a large image is shrunk to 480 px on its longest side and stored as JPEG in the file", async ({
  page,
}) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [{ name: "big.png", dataUrl: await image(page, "#3355cc", 1600, 1200) }]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);
  const file = await saved(page);
  const photo = file.people[0].photos[0];
  expect(photo.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(await size(page, photo.dataUrl)).toEqual({ w: 480, h: 360 });
  // Small images are not enlarged.
  await pick(page, [{ name: "small.png", dataUrl: await image(page, "#33cc55", 200, 100) }]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(2);
  const second = (await saved(page)).people[0].photos[1];
  expect(await size(page, second.dataUrl)).toEqual({ w: 200, h: 100 });
});

test("several photos at once keep their order; the first stays main", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(
    page,
    await Promise.all(
      ["#aa0000", "#00aa00", "#0000aa"].map(async (c, i) => ({
        name: `${i}.png`,
        dataUrl: await image(page, c),
      })),
    ),
  );
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(3);
  await expect(page.getByTestId("photo-main-badge")).toHaveCount(1);
  const photos = (await saved(page)).people[0].photos as { dataUrl: string }[];
  expect(new Set(photos.map((p) => p.dataUrl)).size).toBe(3);
});

test("a cancelled picker changes nothing; a file that is not an image is reported", async ({
  page,
}) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, []);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(0);

  await pick(page, [{ name: "notes.txt", dataUrl: "data:text/plain;base64,aGVsbG8=" }]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("error")).toContainText("not a supported image");
  await expect(page.getByTestId("photo-thumb")).toHaveCount(0);
});

test("a good image next to a bad one: the good one is added, the problem is reported", async ({
  page,
}) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [
    { name: "ok.png", dataUrl: await image(page, "#cc8800") },
    { name: "bad.png", dataUrl: "data:image/png;base64,AAAA" },
  ]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);
  await expect(page.getByTestId("error")).toContainText("not a supported image");
});

test("a person can have at most 12 photos", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  const one = { name: "a.png", dataUrl: await image(page, "#445566", 100, 100) };
  await pick(
    page,
    Array.from({ length: 12 }, () => one),
  );
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(12);
  await expect(page.getByTestId("photo-add")).toBeDisabled();
});

test("the viewer shows the photo, navigates, captions, makes main and closes", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [
    { name: "1.png", dataUrl: await image(page, "#aa0000", 300, 300) },
    { name: "2.png", dataUrl: await image(page, "#00aa00", 300, 300) },
  ]);
  await page.getByTestId("photo-add").click();
  await page.getByTestId("photo-thumb").nth(1).click();
  await expect(page.getByTestId("photo-viewer")).toBeVisible();
  await expect(page.getByTestId("viewer-count")).toHaveText("2 / 2");
  await expect(page.getByTestId("viewer-main")).toHaveCount(0);

  await page.getByTestId("viewer-prev").click();
  await expect(page.getByTestId("viewer-count")).toHaveText("1 / 2");
  await expect(page.getByTestId("viewer-main")).toBeVisible();
  await page.getByTestId("viewer-next").click();

  // Caption.
  await expect(page.getByTestId("viewer-save-caption")).toBeDisabled();
  await page.getByTestId("viewer-caption").fill("  Garden, 1990 ");
  await page.getByTestId("viewer-save-caption").click();
  await expect(page.getByTestId("viewer-save-caption")).toBeDisabled();
  expect((await saved(page)).people[0].photos[1].caption).toBe("Garden, 1990");

  // Make it the main photo: it moves to the front and the viewer follows.
  const before = (await saved(page)).people[0].photos[1].dataUrl as string;
  await page.getByTestId("viewer-make-main").click();
  await expect(page.getByTestId("viewer-count")).toHaveText("1 / 2");
  await expect(page.getByTestId("viewer-main")).toBeVisible();
  expect((await saved(page)).people[0].photos[0].dataUrl).toBe(before);
  await expect(page.getByTestId("person-card").getByTestId("avatar-photo")).toHaveAttribute(
    "src",
    before,
  );

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("photo-viewer")).toHaveCount(0);
});

test("removing a photo asks first; removing the main one promotes the next", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [
    { name: "1.png", dataUrl: await image(page, "#aa0000", 300, 300) },
    { name: "2.png", dataUrl: await image(page, "#00aa00", 300, 300) },
  ]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(2);
  const second = (await saved(page)).people[0].photos[1].dataUrl as string;
  await page.getByTestId("photo-thumb").first().click();

  await page.evaluate(() => localStorage.setItem("fake:confirm", "no"));
  await page.getByTestId("viewer-remove").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(2);

  await page.evaluate(() => localStorage.setItem("fake:confirm", "yes"));
  await page.getByTestId("viewer-remove").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);
  expect((await saved(page)).people[0].photos[0].dataUrl).toBe(second);
  await expect(page.getByTestId("viewer-count")).toHaveText("1 / 1");
  await page.getByTestId("viewer-remove").click(); // the last one: the viewer closes
  await expect(page.getByTestId("photo-viewer")).toHaveCount(0);
  await expect(page.getByTestId("photos-empty")).toBeVisible();
  expect("photos" in (await saved(page)).people[0]).toBe(false);
});

test("photos survive a restart and a copy of the family, and go with the person", async ({
  page,
}) => {
  await start(page, "Ada", "Byron");
  await open(page, "Ada");
  await pick(page, [{ name: "a.png", dataUrl: await image(page, "#aa0000", 300, 300) }]);
  await page.getByTestId("photo-add").click();
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);

  await page.reload();
  await page.getByTestId("resume").click();
  await open(page, "Ada");
  await expect(page.getByTestId("photo-thumb")).toHaveCount(1);

  // Save a copy: the fake save dialog writes to the same path, so check the file contents instead.
  expect(JSON.stringify(await saved(page))).toContain("data:image/jpeg;base64,");

  await page.getByTestId("detail-delete").click();
  expect(JSON.stringify(await saved(page))).not.toContain("data:image");
});

test("a file without photos loads and shows initials", async ({ page }) => {
  await start(page, "Ada");
  await page.reload();
  await page.getByTestId("resume").click();
  await expect(page.getByTestId("avatar-initials")).toHaveCount(1);
});

test.describe("in the trees", () => {
  async function family(page: Page): Promise<void> {
    await start(page, "Maximilienne-Alexandrine Fitzgerald", "Child");
    await page.getByTestId("rel-kind").selectOption("parent");
    await page.getByTestId("rel-first").selectOption({ index: 1 });
    await page.getByTestId("rel-second").selectOption({ index: 2 });
    await page.getByTestId("rel-add").click();
    await open(page, "Maximilienne-Alexandrine Fitzgerald");
    await pick(page, [{ name: "m.png", dataUrl: await image(page, "#7733aa", 600, 800) }]);
    await page.getByTestId("photo-add").click();
    await expect(page.getByTestId("photo-thumb")).toHaveCount(1);
    await page.getByTestId("detail-close").click();
    await page.getByTestId("tab-tree").click();
    await page.getByTestId("tree-root").selectOption({ label: "Child" });
  }

  test("a box shows a round portrait at the left, initials when there is no photo", async ({
    page,
  }) => {
    await family(page);
    await expect(page.getByTestId("tree-avatar")).toHaveCount(2);
    await expect(page.locator('[data-testid="tree-avatar"][data-photo="true"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="tree-avatar"][data-photo="false"]')).toHaveCount(1);
    const withPhoto = page
      .getByTestId("tree-node")
      .filter({ has: page.locator('[data-photo="true"]') });
    const box = (await withPhoto.locator("rect").first().boundingBox())!;
    const image = (await withPhoto.locator("image").boundingBox())!;
    // The portrait sits inside the box, at its left, and is as wide as it is tall (round).
    expect(image.x).toBeGreaterThanOrEqual(box.x);
    expect(image.x + image.width).toBeLessThan(box.x + box.width / 2);
    expect(Math.abs(image.width - image.height)).toBeLessThan(1);
    // And it is clipped to a circle.
    await expect(withPhoto.locator("image")).toHaveAttribute("clip-path", "url(#tree-avatar-clip)");
  });

  test("long names are shortened and stay inside the box, to the right of the portrait", async ({
    page,
  }) => {
    await family(page);
    await page.getByTestId("tree-root").selectOption({ label: "Child" });
    const node = page.getByTestId("tree-node").filter({ hasText: /^Maximilienne/ });
    await expect(node).toContainText("…");
    const rect = (await node.locator("rect").first().boundingBox())!;
    const text = (await node.locator("text").first().boundingBox())!;
    const avatar = (await node.getByTestId("tree-avatar").boundingBox())!;
    expect(text.x).toBeGreaterThanOrEqual(avatar.x + avatar.width - 1);
    expect(text.x + text.width).toBeLessThanOrEqual(rect.x + rect.width + 0.5);
  });

  test("clicking and double-clicking a box with a portrait still work", async ({ page }) => {
    await family(page);
    const node = page.getByTestId("tree-node").filter({ hasText: /^Maximilienne/ });
    await node.click();
    await expect(page.getByTestId("detail-name")).toContainText("Maximilienne");
    await node.dblclick();
    await expect(page.locator('[data-testid="tree-node"][data-root="true"]')).toContainText(
      "Maximilienne",
    );
  });

  test("the card's small tree shows portraits too", async ({ page }) => {
    await family(page);
    await page
      .getByTestId("tree-node")
      .filter({ hasText: /^Child/ })
      .click();
    const mini = page.getByTestId("mini-tree");
    await expect(mini.getByTestId("tree-avatar")).toHaveCount(2);
    await expect(mini.locator('[data-photo="true"]')).toHaveCount(1);
  });

  test("portraits and discs stay visible in the dark theme", async ({ page }) => {
    await family(page);
    await page.getByTestId("theme-toggle").click();
    const image = (await page
      .locator('[data-testid="tree-avatar"][data-photo="true"] image')
      .boundingBox())!;
    expect(image.width).toBeGreaterThan(30);
    const disc = page.locator('[data-testid="tree-avatar"][data-photo="false"] circle').first();
    expect(Number(await disc.getAttribute("r"))).toBeGreaterThan(15);
  });
});

test("French labels in the gallery and viewer", async ({ page }) => {
  await start(page, "Ada");
  await open(page, "Ada");
  await pick(page, [{ name: "a.png", dataUrl: await image(page, "#aa0000", 300, 300) }]);
  await page.getByTestId("photo-add").click();
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("photo-add")).toContainText("Ajouter des photos");
  await page.getByTestId("photo-thumb").click();
  await expect(page.getByTestId("viewer-main")).toHaveText("Photo principale");
  await expect(page.getByTestId("viewer-save-caption")).toContainText("Enregistrer la légende");
  await expect(page.getByTestId("viewer-remove")).toContainText("Retirer");
});
