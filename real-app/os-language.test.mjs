// First launch follows the operating system's language (a real French locale in the real
// webview), and a saved choice wins afterwards. Needs the fr_FR locale (see DEVELOPMENT.md).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { dataHome, launch, startStack } from "./harness.mjs";

const settings = join(dataHome, "data", "app.genealogigi", "settings.json");
const hasFrench = /fr_FR/i.test(execFileSync("locale", ["-a"]).toString());

let stop;
let app;

before(async () => {
  if (!hasFrench) return;
  stop = await startStack({ LANG: "fr_FR.UTF-8", LANGUAGE: "fr", LC_ALL: "fr_FR.UTF-8" });
  app = await launch();
});

after(async () => {
  await app?.quit();
  await stop?.();
});

describe(
  "language follows the system, then the user's choice",
  { skip: hasFrench ? false : "the fr_FR locale is not installed" },
  () => {
    it("first launch on a French system is in French and saves nothing", async () => {
      await app.until(
        "return document.querySelector('[data-testid=tagline]')?.textContent.includes('Votre arbre généalogique')",
        "the French tagline",
      );
      assert.equal(await app.attr("lang-fr", "aria-pressed"), "true");
      assert.equal(
        existsSync(settings) && /"language"/.test(readFileSync(settings, "utf8")),
        false,
        "following the system must not save a choice",
      );
    });

    it("choosing English is saved and wins over the French system after a restart", async () => {
      await app.click("lang-en");
      const end = Date.now() + 10_000;
      while (!(existsSync(settings) && /"language": "en"/.test(readFileSync(settings, "utf8")))) {
        assert.ok(Date.now() < end, "the choice was not saved");
        await new Promise((r) => setTimeout(r, 200));
      }
      await app.quit();
      app = await launch();
      await app.until(
        "return document.querySelector('[data-testid=tagline]')?.textContent.includes('Your family tree')",
        "the English tagline",
      );
    });
  },
);
