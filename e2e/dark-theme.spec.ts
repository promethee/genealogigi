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
        getTheme: async () => localStorage.getItem("fake:theme"),
        setTheme: async (t: string) => localStorage.setItem("fake:theme", t),
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

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));

/** Reads any CSS colour as [r, g, b, a] through a canvas, whatever notation the browser reports. */
async function contrast(page: Page, testId: string): Promise<number> {
  return page
    .getByTestId(testId)
    .first()
    .evaluate((el) => {
      const toRgba = (css: string): [number, number, number, number] => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const x = c.getContext("2d")!;
        x.clearRect(0, 0, 1, 1);
        x.fillStyle = css;
        x.fillRect(0, 0, 1, 1);
        const d = x.getImageData(0, 0, 1, 1).data;
        return [d[0]!, d[1]!, d[2]!, d[3]! / 255];
      };
      // Composite the background colours from the page down to the element.
      const chain: Element[] = [];
      for (let n: Element | null = el; n; n = n.parentElement) chain.unshift(n);
      let bg: [number, number, number] = [255, 255, 255];
      for (const node of chain) {
        const [r, g, b, a] = toRgba(getComputedStyle(node).backgroundColor);
        if (a > 0) bg = [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)];
      }
      const [fr, fg, fb, fa] = toRgba(getComputedStyle(el).color);
      const fgc = [
        fr * fa + bg[0] * (1 - fa),
        fg * fa + bg[1] * (1 - fa),
        fb * fa + bg[2] * (1 - fa),
      ];
      const lum = (c: number[]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
      };
      const [l1, l2] = [lum(fgc), lum(bg)];
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    });
}

async function populate(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByTestId("create").click();
  for (const name of ["Ada", "Byron"]) {
    await page.getByTestId("add-person").click();
    await page.getByTestId("first-name").fill(name);
    await page.getByTestId("birth-year").fill("1990");
    await page.getByTestId("submit-person").click();
  }
  await page.getByTestId("rel-kind").selectOption("parent");
  await page.getByTestId("rel-first").selectOption({ label: "Ada" });
  await page.getByTestId("rel-second").selectOption({ label: "Byron" });
  await page.getByTestId("rel-add").click();
}

test("the toggle switches between light and dark and swaps its icon", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
  expect(await isDark(page)).toBe(false);
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute(
    "aria-label",
    "Switch to dark theme",
  );

  await page.getByTestId("theme-toggle").click();
  expect(await isDark(page)).toBe(true);
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute(
    "aria-label",
    "Switch to light theme",
  );

  await page.getByTestId("theme-toggle").click();
  expect(await isDark(page)).toBe(false);
});

test("the page background and text really change", async ({ page }) => {
  await populate(page);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const card = () =>
    page
      .getByTestId("person-row")
      .first()
      .evaluate((el) => {
        let n: Element | null = el;
        while (n && getComputedStyle(n).backgroundColor === "rgba(0, 0, 0, 0)") n = n.parentElement;
        return getComputedStyle(n!).backgroundColor;
      });
  const light = { bg: await bg(), card: await card() };
  await page.getByTestId("theme-toggle").click();
  const dark = { bg: await bg(), card: await card() };
  expect(dark.bg).not.toBe(light.bg);
  expect(dark.card).not.toBe(light.card);
  // No white panel is left in dark mode.
  expect(dark.card).not.toBe("rgb(255, 255, 255)");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    "dark",
  );
});

test("a first launch follows the system preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByTestId("create")).toBeVisible();
  expect(await isDark(page)).toBe(true);
});

test("a saved choice wins over the system, and is remembered after a restart", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  // Seed the saved choice once, so the restart below keeps whatever the app saved afterwards.
  await page.addInitScript(() => {
    if (!localStorage.getItem("fake:theme")) localStorage.setItem("fake:theme", "light");
  });
  await page.goto("/");
  await expect(page.getByTestId("create")).toBeVisible();
  expect(await isDark(page)).toBe(false);

  await page.getByTestId("theme-toggle").click();
  expect(await isDark(page)).toBe(true);
  await page.reload();
  await expect(page.getByTestId("create")).toBeVisible();
  expect(await isDark(page)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("fake:theme"))).toBe("dark");
});

test("a live change of the system preference is followed until the user chooses", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("create")).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => isDark(page)).toBe(true);
  await page.getByTestId("theme-toggle").click(); // explicit: light
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await isDark(page)).toBe(false);
});

test("the tree and the small family tree use themed colours, not white boxes", async ({ page }) => {
  await populate(page);
  await page.getByTestId("theme-toggle").click();
  await page.getByTestId("tab-tree").click();
  await page.getByTestId("tree-direction").selectOption("hourglass");
  await page.getByTestId("tree-root").selectOption({ label: "Byron" });
  const nodeFill = () =>
    page
      .locator('[data-testid="tree-node"][data-root="false"] rect')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
  expect(await nodeFill()).not.toBe("rgb(255, 255, 255)");
  await page.getByTestId("tree-node").first().click();
  await expect(page.getByTestId("mini-tree")).toBeVisible();
  const miniFill = await page
    .locator(
      '[data-testid="mini-node"][data-role="parent"] rect, [data-testid="mini-node"][data-role="child"] rect',
    )
    .first()
    .evaluate((el) => getComputedStyle(el).fill);
  expect(miniFill).not.toBe("rgb(255, 255, 255)");
});

for (const theme of ["light", "dark"] as const) {
  test(`text keeps readable contrast in the ${theme} theme`, async ({ page }) => {
    await populate(page);
    if (theme === "dark") await page.getByTestId("theme-toggle").click();

    // Primary text on cards and inputs, 4.5:1.
    expect(await contrast(page, "person-name")).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page, "rel-add")).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page, "loaded-summary")).toBeGreaterThanOrEqual(4.5);
    // Muted text, 3:1.
    expect(await contrast(page, "person-life")).toBeGreaterThanOrEqual(3);
    expect(await contrast(page, "tab-tree")).toBeGreaterThanOrEqual(3);
    // A link inside the card.
    await page.getByTestId("view-person").first().click();
    await expect(page.getByTestId("detail-name")).toBeVisible();
    expect(await contrast(page, "detail-name")).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page, "detail-relative")).toBeGreaterThanOrEqual(4.5);
    // Inputs and error messages.
    await page.getByTestId("detail-edit").click();
    await page.getByTestId("first-name").first().fill("Ada");
    expect(await contrast(page, "first-name")).toBeGreaterThanOrEqual(4.5);
    await page.getByTestId("birth-year").fill(String(new Date().getFullYear() + 1));
    await page.getByTestId("submit-person").click();
    await expect(page.getByTestId("error")).toBeVisible();
    expect(await contrast(page, "error")).toBeGreaterThanOrEqual(4.5);
  });
}

test("the theme button is available on the welcome screen and in French", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute(
    "aria-label",
    "Passer au thème sombre",
  );
});
