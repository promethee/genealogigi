import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";
import { applyTheme, defineThemeStore, initialTheme, isTheme } from "./theme.ts";

function make(options: { saved?: string | null; dark?: boolean; noSettings?: boolean } = {}) {
  const setTheme = vi.fn(async () => {});
  const platform = {
    settings: options.noSettings
      ? {
          getTheme: async () => {
            throw new Error("unsupported");
          },
          setTheme: async () => {
            throw new Error("unsupported");
          },
        }
      : { getTheme: async () => options.saved ?? null, setTheme },
  } as unknown as PlatformAPI;
  setActivePinia(createPinia());
  const store = defineThemeStore(platform, () => options.dark ?? false)();
  return { store, setTheme };
}

beforeEach(() => setActivePinia(createPinia()));

describe("theme store", () => {
  it("follows the system when nothing was saved", async () => {
    const dark = make({ dark: true });
    await dark.store.init();
    expect(dark.store.theme).toBe("dark");
    expect(dark.store.explicit).toBe(false);
    const light = make({ dark: false });
    await light.store.init();
    expect(light.store.theme).toBe("light");
  });

  it("a saved choice wins over the system", async () => {
    const { store } = make({ saved: "light", dark: true });
    await store.init();
    expect(store.theme).toBe("light");
    expect(store.explicit).toBe(true);
    const dark = make({ saved: "dark", dark: false });
    await dark.store.init();
    expect(dark.store.theme).toBe("dark");
  });

  it("ignores an invalid saved value", async () => {
    const { store } = make({ saved: "purple", dark: true });
    await store.init();
    expect(store.theme).toBe("dark");
    expect(store.explicit).toBe(false);
  });

  it("toggle switches, becomes explicit and is saved", async () => {
    const { store, setTheme } = make({ dark: false });
    await store.init();
    await store.toggle();
    expect(store.theme).toBe("dark");
    expect(store.explicit).toBe(true);
    expect(setTheme).toHaveBeenLastCalledWith("dark");
    await store.toggle();
    expect(store.theme).toBe("light");
    expect(setTheme).toHaveBeenLastCalledWith("light");
  });

  it("works when the shell cannot save settings", async () => {
    const { store } = make({ noSettings: true, dark: true });
    await expect(store.init()).resolves.toBeUndefined();
    await expect(store.toggle()).resolves.toBeUndefined();
    expect(store.theme).toBe("light");
  });
});

describe("applyTheme / initialTheme", () => {
  const fakeRoot = () => {
    const classes = new Set<string>();
    return {
      classList: {
        toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
      },
      style: { colorScheme: "" },
      classes,
    };
  };

  it("sets the dark class and the native color scheme", () => {
    const root = fakeRoot();
    applyTheme("dark", root as unknown as HTMLElement);
    expect(root.classes.has("dark")).toBe(true);
    expect(root.style.colorScheme).toBe("dark");
    applyTheme("light", root as unknown as HTMLElement);
    expect(root.classes.has("dark")).toBe(false);
    expect(root.style.colorScheme).toBe("light");
  });

  it("does nothing without a document", () => {
    expect(() => applyTheme("dark", undefined)).not.toThrow();
  });

  it("falls back to the system preference without a cached choice", () => {
    expect(initialTheme(() => true)).toBe("dark");
    expect(initialTheme(() => false)).toBe("light");
  });

  it("recognises valid themes only", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});
