// First launch follows the operating system's dark mode (a real dark GTK setting inside the real
// webview), and a saved choice wins afterwards.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { dataHome, launch, startStack } from "./harness.mjs";

const settings = join(dataHome, "data", "app.genealogigi", "settings.json");
const isDark = (app) => app.eval("return document.documentElement.classList.contains('dark')");

let stop;
let app;

before(async () => {
  stop = await startStack({ GTK_THEME: "Adwaita:dark" });
  app = await launch();
});

after(async () => {
  await app?.quit();
  await stop?.();
});

describe("theme follows the system, then the user's choice", () => {
  it("first launch with a dark system starts dark and saves nothing", async () => {
    await app.until("return document.documentElement.classList.contains('dark')", "the dark theme");
    assert.equal(
      existsSync(settings) && /"theme"/.test(readFileSync(settings, "utf8")),
      false,
      "following the system must not save a choice",
    );
  });

  it("clicking the toggle switches to light and saves the choice", async () => {
    await app.click("theme-toggle");
    await app.until(
      "return !document.documentElement.classList.contains('dark')",
      "the light theme",
    );
    const end = Date.now() + 10_000;
    while (!(existsSync(settings) && /"theme": "light"/.test(readFileSync(settings, "utf8")))) {
      assert.ok(Date.now() < end, "the choice was not saved");
      await new Promise((r) => setTimeout(r, 200));
    }
  });

  it("the saved choice wins over the dark system after a restart", async () => {
    await app.quit();
    app = await launch();
    await new Promise((r) => setTimeout(r, 2500));
    assert.equal(await isDark(app), false);
  });
});
