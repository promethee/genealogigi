import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_TITLE } from "../appInfo.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";
import { defineAppStore } from "./app.ts";

function release(tag: string | null, status = 200) {
  return vi.fn(async () => ({
    ok: status < 400,
    status,
    json: async () =>
      tag ? { tag_name: tag, html_url: `https://github.com/x/y/releases/${tag}` } : {},
  }));
}

function make(options: {
  fetchFn: ReturnType<typeof release>;
  dismissed?: string | null;
  noWindow?: boolean;
  version?: string;
}) {
  const setTitle = vi.fn(async () => {});
  const setDismissed = vi.fn(async () => {});
  const openExternal = vi.fn(async () => {});
  const platform = {
    window: options.noWindow
      ? {
          setTitle: async () => {
            throw new Error("no window");
          },
        }
      : { setTitle },
    openExternal,
    settings: {
      getDismissedUpdate: async () => options.dismissed ?? null,
      setDismissedUpdate: setDismissed,
    },
  } as unknown as PlatformAPI;
  setActivePinia(createPinia());
  const store = defineAppStore(platform, options.fetchFn, options.version ?? "0.1.0")();
  return { store, setTitle, setDismissed, openExternal };
}

beforeEach(() => setActivePinia(createPinia()));

describe("app store", () => {
  it("sets the window title to the name and version", async () => {
    const { store, setTitle } = make({ fetchFn: release("v0.1.0") });
    await store.init();
    expect(setTitle).toHaveBeenCalledWith(APP_TITLE);
    expect(APP_TITLE).toMatch(/^Genealogigi \d+\.\d+\.\d+/);
  });

  it("shows the banner when a newer release exists", async () => {
    const { store } = make({ fetchFn: release("v0.2.0") });
    await store.init();
    expect(store.bannerVisible).toBe(true);
    expect(store.update?.latest).toBe("0.2.0");
  });

  it("stays silent when up to date, without a release, or offline", async () => {
    for (const fetchFn of [release("v0.1.0"), release(null, 404), release(null, 500)]) {
      const { store } = make({ fetchFn });
      await store.init();
      expect(store.bannerVisible).toBe(false);
      expect(store.manualResult).toBeNull();
    }
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const { store } = make({ fetchFn: offline as never });
    await store.init();
    expect(store.bannerVisible).toBe(false);
  });

  it("does not show a banner for a version that was dismissed", async () => {
    const { store } = make({ fetchFn: release("v0.2.0"), dismissed: "0.2.0" });
    await store.init();
    expect(store.bannerVisible).toBe(false);
  });

  it("shows the banner again for a newer version than the dismissed one", async () => {
    const { store } = make({ fetchFn: release("v0.3.0"), dismissed: "0.2.0" });
    await store.init();
    expect(store.bannerVisible).toBe(true);
  });

  it("dismiss hides the banner and remembers the version", async () => {
    const { store, setDismissed } = make({ fetchFn: release("v0.2.0") });
    await store.init();
    await store.dismiss();
    expect(store.bannerVisible).toBe(false);
    expect(setDismissed).toHaveBeenCalledWith("0.2.0");
  });

  it("download opens the release page and installs nothing", async () => {
    const { store, openExternal } = make({ fetchFn: release("v0.2.0") });
    await store.init();
    await store.download();
    expect(openExternal).toHaveBeenCalledWith("https://github.com/x/y/releases/v0.2.0");
  });

  it("flags a browser that cannot be opened, and clears it on a later success", async () => {
    const { store, openExternal } = make({ fetchFn: release("v0.2.0") });
    await store.init();
    openExternal.mockRejectedValueOnce(new Error("no browser"));
    await store.download();
    expect(store.openFailed).toBe(true);
    await store.download();
    expect(store.openFailed).toBe(false);
  });

  it("works when the shell has no window or settings support", async () => {
    const { store } = make({ fetchFn: release("v0.2.0"), noWindow: true });
    await expect(store.init()).resolves.toBeUndefined();
    expect(store.bannerVisible).toBe(true);
  });

  describe("manual check", () => {
    it("reports up to date", async () => {
      const { store } = make({ fetchFn: release("v0.1.0") });
      await store.checkNow();
      expect(store.manualResult).toBe("current");
    });

    it("reports a failure", async () => {
      const { store } = make({ fetchFn: release(null, 500) });
      await store.checkNow();
      expect(store.manualResult).toBe("failed");
    });

    it("shows the banner even for a dismissed version", async () => {
      const { store } = make({ fetchFn: release("v0.2.0"), dismissed: "0.2.0" });
      await store.init();
      expect(store.bannerVisible).toBe(false);
      await store.checkNow();
      expect(store.bannerVisible).toBe(true);
      expect(store.manualResult).toBeNull();
    });

    it("clears the previous result before checking again", async () => {
      const fetchFn = release(null, 500);
      const { store } = make({ fetchFn });
      await store.checkNow();
      fetchFn.mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ tag_name: "v0.1.0", html_url: "https://github.com/x/y" }),
      }));
      await store.checkNow();
      expect(store.manualResult).toBe("current");
    });
  });
});
