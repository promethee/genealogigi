import { expect, test, type Page } from "@playwright/test";

// Fake PlatformAPI that records the window title and opened links, and a fake release endpoint.
async function boot(
  page: Page,
  options: { tag?: string; status?: number; dismissed?: string; offline?: boolean } = {},
): Promise<void> {
  await page.addInitScript((opts) => {
    const w = window as unknown as Record<string, unknown>;
    const read = (key: string) => localStorage.getItem(key);
    if (opts.dismissed && !read("fake:dismissed"))
      localStorage.setItem("fake:dismissed", opts.dismissed);
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/up.json",
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
        getLanguage: async () => read("fake:language"),
        setLanguage: async (l: string) => localStorage.setItem("fake:language", l),
        getDismissedUpdate: async () => read("fake:dismissed"),
        setDismissedUpdate: async (v: string) => localStorage.setItem("fake:dismissed", v),
      },
      git: { status: async () => "not-repo", sync: async () => "no-changes" },
      window: { setTitle: async (title: string) => localStorage.setItem("fake:title", title) },
      openExternal: async (url: string) => localStorage.setItem("fake:opened", url),
      exit: async () => {},
    };
    let calls = 0;
    w.__GENEALOGIGI_FETCH__ = async (url: string, init?: { body?: unknown }) => {
      calls += 1;
      localStorage.setItem("fake:fetchCalls", String(calls));
      localStorage.setItem("fake:fetchUrl", url);
      localStorage.setItem("fake:fetchBody", String(init?.body ?? ""));
      if (opts.offline) throw new TypeError("Failed to fetch");
      const status = opts.status ?? 200;
      return {
        ok: status < 400,
        status,
        json: async () => ({
          tag_name: opts.tag ?? "v0.0.1",
          html_url: `https://github.com/promethee/genealogigi/releases/tag/${opts.tag ?? "v0.0.1"}`,
        }),
      };
    };
  }, options);
}

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

test("the window title is the name and the version", async ({ page }) => {
  await boot(page);
  await page.goto("/");
  await expect.poll(() => stored(page, "fake:title")).toMatch(/^Genealogigi \d+\.\d+\.\d+$/);
});

test("a newer release shows a banner with Download and Dismiss at startup", async ({ page }) => {
  await boot(page, { tag: "v9.9.9" });
  await page.goto("/");
  await expect(page.getByTestId("update-banner")).toBeVisible();
  await expect(page.getByTestId("update-text")).toContainText("Version 9.9.9 is available");
  await expect(page.getByTestId("update-download")).toBeVisible();
  await expect(page.getByTestId("update-dismiss")).toBeVisible();
  // Only the public release endpoint is read, with no body.
  expect(await stored(page, "fake:fetchUrl")).toBe(
    "https://api.github.com/repos/promethee/genealogigi/releases/latest",
  );
  expect(await stored(page, "fake:fetchBody")).toBe("");
  // Calling the check never touched the family: nothing has been created or loaded.
  await expect(page.getByTestId("create")).toBeVisible();
});

test("Download opens the release page", async ({ page }) => {
  await boot(page, { tag: "v9.9.9" });
  await page.goto("/");
  await page.getByTestId("update-download").click();
  expect(await stored(page, "fake:opened")).toBe(
    "https://github.com/promethee/genealogigi/releases/tag/v9.9.9",
  );
});

test("Dismiss hides the banner and it stays hidden after a restart", async ({ page }) => {
  await boot(page, { tag: "v9.9.9" });
  await page.goto("/");
  await page.getByTestId("update-dismiss").click();
  await expect(page.getByTestId("update-banner")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("create")).toBeVisible();
  await expect(page.getByTestId("update-banner")).toHaveCount(0);
  expect(await stored(page, "fake:dismissed")).toBe("9.9.9");
});

test("a dismissed version does not hide a newer one", async ({ page }) => {
  await boot(page, { tag: "v9.9.10", dismissed: "9.9.9" });
  await page.goto("/");
  await expect(page.getByTestId("update-banner")).toBeVisible();
});

test("nothing is shown when up to date, with no release, or offline", async ({ page }) => {
  for (const options of [{ tag: "v0.0.1" }, { status: 404 }, { status: 500 }, { offline: true }]) {
    await page.goto("about:blank");
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    const fresh = await page.context().newPage();
    await boot(fresh, options);
    await fresh.goto("/");
    await expect(fresh.getByTestId("create")).toBeVisible();
    // Wait until the startup check has actually run before asserting that nothing appeared.
    await expect.poll(() => stored(fresh, "fake:fetchCalls")).toBe("1");
    await expect(fresh.getByTestId("update-banner")).toHaveCount(0);
    await expect(fresh.getByTestId("update-result")).toHaveCount(0);
    await fresh.close();
  }
});

test("Check for updates reports 'up to date' and 'could not check'", async ({ page }) => {
  await boot(page, { tag: "v0.0.1" });
  await page.goto("/");
  await page.getByTestId("check-update").click();
  await expect(page.getByTestId("update-result")).toContainText("You are up to date");

  const offline = await page.context().newPage();
  await boot(offline, { offline: true });
  await offline.goto("/");
  await offline.getByTestId("check-update").click();
  await expect(offline.getByTestId("update-result")).toHaveText("Could not check for updates.");
  await offline.close();
});

test("a manual check shows the banner again for a dismissed version", async ({ page }) => {
  await boot(page, { tag: "v9.9.9", dismissed: "9.9.9" });
  await page.goto("/");
  await expect(page.getByTestId("update-banner")).toHaveCount(0);
  await page.getByTestId("check-update").click();
  await expect(page.getByTestId("update-banner")).toBeVisible();
});

test("banner and button are French in French", async ({ page }) => {
  await boot(page, { tag: "v9.9.9" });
  await page.goto("/");
  await page.getByTestId("lang-fr").click();
  await expect(page.getByTestId("check-update")).toContainText("Rechercher des mises à jour");
  await expect(page.getByTestId("update-text")).toContainText("La version 9.9.9 est disponible");
  await expect(page.getByTestId("update-download")).toHaveText("Télécharger");
});

test("the app works when the shell has no title, link or update support", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/min.json",
      confirm: async () => true,
      data: {
        exists: async () => false,
        load: async () => ({ schemaVersion: 1, people: [], relationships: [] }),
        save: async () => {},
      },
      settings: { getLastFilePath: async () => null, setLastFilePath: async () => {} },
      exit: async () => {},
    };
  });
  await page.goto("/");
  await page.getByTestId("create").click();
  await expect(page.getByTestId("loaded-summary")).toBeVisible();
  await expect(page.getByTestId("update-banner")).toHaveCount(0);
});
