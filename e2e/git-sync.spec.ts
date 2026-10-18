import { expect, test, type Page } from "@playwright/test";

// Real UI + store against a fake PlatformAPI (the "disk" lives in localStorage so it
// survives reloads). Real dialogs and files: see MANUAL_TESTS.md.
// Fake PlatformAPI with a controllable git: status and sync results come from localStorage,
// and a sync replaces the "file" the way a pull would. Real git: see the cargo tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = (key: string) => localStorage.getItem(key);
    const w = window as unknown as Record<string, unknown>;
    w.__GENEALOGIGI_PLATFORM__ = {
      openFileDialog: async () => null,
      saveFileDialog: async () => "C:/families/git.json",
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
      git: {
        status: async () => read("fake:gitStatus") ?? "ready",
        sync: async (p: string) => {
          await new Promise((r) => setTimeout(r, 150));
          const failure = read("fake:gitError");
          if (failure) throw new Error(failure);
          const pulled = read("fake:gitPull");
          if (pulled) localStorage.setItem(`fake:file:${p}`, pulled);
          return "Synced with git: committed your changes and pushed.";
        },
      },
      exit: async () => {},
    };
  });
});

async function addPerson(page: Page, first: string): Promise<void> {
  await page.getByTestId("add-person").click();
  await page.getByTestId("first-name").fill(first);
  await page.getByTestId("submit-person").click();
}

async function newFamily(page: Page, gitStatus?: string): Promise<void> {
  await page.goto("/");
  if (gitStatus) await page.evaluate((s) => localStorage.setItem("fake:gitStatus", s), gitStatus);
  await page.getByTestId("create").click();
}

test("syncs, shows the result and disables the button while running", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada");
  await page.getByTestId("git-sync").click();
  await expect(page.getByTestId("git-sync")).toBeDisabled();
  await expect(page.getByTestId("git-sync")).toHaveText("Syncing…");
  await expect(page.getByTestId("notice")).toContainText("Synced with git");
  await expect(page.getByTestId("git-sync")).toBeEnabled();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
});

test("shows pulled data after a sync", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada");
  const pulled = {
    schemaVersion: 1,
    people: [
      { id: "11111111-1111-4111-8111-111111111111", names: { firstNames: [named("Ada")] } },
      { id: "22222222-2222-4222-8222-222222222222", names: { firstNames: [named("Byron")] } },
    ],
    relationships: [],
  };
  function named(value: string) {
    return {
      value,
      kind: "birth",
      date: {
        raw: "9999-01-01T00:00",
        yearKnown: false,
        monthKnown: false,
        dayKnown: false,
        hourKnown: false,
        minuteKnown: false,
      },
    };
  }
  await page.evaluate((json) => localStorage.setItem("fake:gitPull", json), JSON.stringify(pulled));
  await page.getByTestId("git-sync").click();
  await expect(page.getByTestId("notice")).toBeVisible();
  await expect(page.getByTestId("person-row")).toHaveCount(2);
});

test("a failed sync shows the error and keeps the data", async ({ page }) => {
  await newFamily(page);
  await addPerson(page, "Ada");
  await page.evaluate(() =>
    localStorage.setItem("fake:gitError", "Could not merge the remote changes."),
  );
  await page.getByTestId("git-sync").click();
  await expect(page.getByTestId("error")).toContainText("Could not merge");
  await expect(page.getByTestId("person-row")).toHaveCount(1);
});

test("explains why sync is unavailable instead of showing the button", async ({ page }) => {
  for (const [status, text] of [
    ["no-git", "git was not found"],
    ["not-repo", "not in a git repository"],
    ["no-remote", "no remote"],
  ] as const) {
    await newFamily(page, status);
    await expect(page.getByTestId("git-sync")).toHaveCount(0);
    await expect(page.getByTestId("git-hint")).toContainText(text);
    await page.evaluate(() => localStorage.clear());
  }
});
