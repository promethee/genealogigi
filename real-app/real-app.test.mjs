// The former manual tests that need the real shell, run automatically: real window, real files,
// real settings store, real restarts. Run with `npm run test:real` (see DEVELOPMENT.md).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { dataHome, launch, startStack } from "./harness.mjs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const work = mkdtempSync(join(tmpdir(), "gigi-real-files-"));
const fam = join(work, "family.gigi");
const exported = join(work, "export.gigi");
const incoming = join(work, "incoming.gigi");
const bad = join(work, "bad.gigi");
const page = join(work, "page.html");

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const sha8 = (text) => createHash("sha256").update(text).digest("hex").slice(0, 8);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const tmpFiles = () => readdirSync(work).filter((f) => f.endsWith(".tmp"));

let stop;
let app;

/** Quits the running app and starts a fresh process on the same data (a real restart). */
async function restart() {
  await app.quit();
  app = await launch();
}

before(async () => {
  stop = await startStack();
  app = await launch();
});

after(async () => {
  await app?.quit();
  await stop?.();
});

describe("welcome screen (real file dialogs seam, real files and settings)", () => {
  it("first launch: welcome screen, Resume greyed out, no error", async () => {
    await app.wait("create");
    assert.equal(await app.disabled("resume"), true);
    assert.equal(await app.count("error"), 0);
  });

  it("the window title carries the version", async () => {
    if (!process.env.DISPLAY) return; // needs an X display to read the native title
    const out = execFileSync("xdotool", ["search", "--name", `Genealogigi ${version}`]).toString();
    assert.ok(out.trim().length > 0, "no window titled with the version");
  });

  it("cancelling the name prompt writes nothing and never reaches the save dialog", async () => {
    await app.answerDialogs({ save: [fam] });
    await app.click("create");
    await app.click("prompt-cancel");
    await app.gone("prompt-dialog");
    assert.equal(existsSync(fam), false);
    assert.equal(await app.count("error"), 0);
    // The scripted save answer was not consumed: the dialog was never opened.
    assert.deepEqual(await app.eval("return window.__GENEALOGIGI_TEST_DIALOGS__.save"), [fam]);
  });

  it("the name is required: OK stays disabled until something is typed", async () => {
    await app.click("create");
    assert.equal(await app.disabled("prompt-ok"), true);
    await app.type("prompt-input", "   ");
    assert.equal(await app.disabled("prompt-ok"), true);
    await app.click("prompt-cancel");
    await app.gone("prompt-dialog");
  });

  it("cancelling the save dialog after naming the family writes nothing", async () => {
    await app.answerDialogs({ save: [null] });
    await app.click("create");
    await app.type("prompt-input", "Lovelace family");
    await app.click("prompt-ok");
    await app.wait("create");
    assert.equal(existsSync(fam), false);
    assert.equal(await app.count("error"), 0);
  });

  it("Create new: loaded view, titled with the name, a real file with schemaVersion 1", async () => {
    await app.createFamily(fam, "Lovelace family");
    assert.equal(await app.text("family-name"), "Lovelace family");
    assert.equal(readJson(fam).name, "Lovelace family");
    assert.equal(await app.text("loaded-path"), fam);
    assert.match(await app.text("loaded-summary"), /0 people · 0 relationships/);
    assert.equal(readJson(fam).schemaVersion, 1);
    assert.deepEqual(tmpFiles(), []);
  });

  it("a person is saved to the real file, atomically", async () => {
    await app.click("add-person");
    await app.type("first-name", "Ada");
    await app.type("last-name", "Lovelace");
    await app.click("submit-person");
    await app.wait("person-row");
    const data = readJson(fam);
    assert.equal(data.people.length, 1);
    assert.equal(data.people[0].names.firstNames[0].value, "Ada");
    assert.deepEqual(tmpFiles(), []);
  });

  it("after a real restart, Resume offers the file and reopens it", async () => {
    await restart();
    // The remembered file is read asynchronously after the first screen appears.
    await app.until(
      "return document.querySelector('[data-testid=resume]')?.disabled === false",
      "Resume to be enabled",
    );
    assert.equal(await app.text("resume"), "Resume Lovelace family"); // the name, read from the file
    await app.resume();
    await app.wait("loaded-path");
    assert.equal(await app.text("loaded-path"), fam);
    await app.wait("person-row");
  });

  it("Close family returns to the welcome screen, Resume still offered", async () => {
    await app.click("close-family");
    await app.wait("create");
    await app.until(
      "return document.querySelector('[data-testid=resume]')?.disabled === false",
      "Resume to be enabled",
    );
  });

  it("cancelling Open shows no error", async () => {
    await app.answerDialogs({ open: [null] });
    await app.click("open");
    await app.wait("create");
    assert.equal(await app.count("error"), 0);
  });

  it("opening a corrupt file shows an error and leaves the file alone", async () => {
    writeFileSync(bad, "{not json");
    await app.answerDialogs({ open: [bad] });
    await app.click("open");
    assert.match(await app.text("error"), /not valid JSON/i);
    assert.equal(readFileSync(bad, "utf8"), "{not json");
    assert.equal(await app.count("loaded-path"), 0);
  });

  it("opening the family file loads it", async () => {
    await app.answerDialogs({ open: [fam] });
    await app.click("open");
    await app.wait("loaded-path");
    assert.equal(await app.text("loaded-path"), fam);
  });
});

describe("export, import with backup, share (real files)", () => {
  it("Export writes the same people to another file and keeps the open file", async () => {
    await app.answerDialogs({ save: [exported] });
    await app.click("export");
    assert.match(await app.text("notice"), /Exported to/);
    assert.deepEqual(readJson(exported).people, readJson(fam).people);
    assert.equal(await app.text("loaded-path"), fam);
  });

  it("Import backs up the previous file (dated, hashed), then replaces the family", async () => {
    const previous = readFileSync(fam, "utf8");
    writeFileSync(
      incoming,
      JSON.stringify({
        schemaVersion: 1,
        people: [
          {
            id: uuid(1),
            names: {
              id: uuid(1),
              firstNames: [
                {
                  value: "Zed",
                  kind: "birth",
                  date: {
                    raw: "0001-01-01T00:00",
                    yearKnown: false,
                    monthKnown: false,
                    dayKnown: false,
                    hourKnown: false,
                    minuteKnown: false,
                  },
                },
              ],
            },
          },
          {
            id: uuid(2),
            names: {
              id: uuid(2),
              firstNames: [
                {
                  value: "Yan",
                  kind: "birth",
                  date: {
                    raw: "0001-01-01T00:00",
                    yearKnown: false,
                    monthKnown: false,
                    dayKnown: false,
                    hourKnown: false,
                    minuteKnown: false,
                  },
                },
              ],
            },
          },
        ],
        relationships: [
          {
            id: uuid(9),
            type: "partner",
            personAId: uuid(1),
            personBId: uuid(2),
            status: "ongoing",
            startDate: {
              raw: "0001-01-01T00:00",
              yearKnown: false,
              monthKnown: false,
              dayKnown: false,
              hourKnown: false,
              minuteKnown: false,
            },
          },
        ],
      }),
    );
    await app.answerDialogs({ open: [incoming] });
    await app.click("import");
    await app.click("confirm-ok"); // the in-app confirmation
    assert.match(await app.text("notice"), /Imported incoming\.gigi/);

    const backups = readdirSync(work).filter((f) => f.includes(".backup-"));
    assert.equal(backups.length, 1);
    assert.match(backups[0], /^family\.backup-\d{8}-\d{6}-[0-9a-f]{8}\.gigi$/);
    assert.equal(readFileSync(join(work, backups[0]), "utf8"), previous);
    assert.ok(
      backups[0].includes(`-${sha8(previous)}.`),
      "backup name carries the hash of the previous file",
    );
    assert.equal(readJson(fam).people.length, 2);
    assert.deepEqual(tmpFiles(), []);
  });

  it("Share writes one self-contained HTML page with everyone in it", async () => {
    await app.answerDialogs({ save: [page] });
    await app.click("share");
    await app.click("confirm-ok");
    assert.match(await app.text("notice"), /Web page saved/);
    const html = readFileSync(page, "utf8");
    assert.ok(html.startsWith("<!doctype html>"));
    assert.doesNotMatch(html, /(src|href)="https?:/i);
    const data = JSON.parse(
      html.match(/<script type="application\/json" id="data">(.*?)<\/script>/s)[1],
    );
    assert.equal(data.people.length, 2);
  });
});

describe("settings survive a real restart", () => {
  it("language and theme are stored in the real settings file", async () => {
    const settings = join(dataHome, "data", "app.genealogigi", "settings.json");
    await app.click("lang-fr");
    await app.click("theme-toggle");
    // Saving is asynchronous: wait until both choices are on disk before closing the app.
    await app.until("return true", "the page");
    const end = Date.now() + 15_000;
    while (!(
      existsSync(settings) &&
      /"theme"/.test(readFileSync(settings, "utf8")) &&
      /"language"/.test(readFileSync(settings, "utf8"))
    )) {
      assert.ok(Date.now() < end, "settings were not written");
      await new Promise((r) => setTimeout(r, 200));
    }
    await restart();
    // Settings are loaded asynchronously after the first screen appears.
    await app.until(
      "return document.querySelector('[data-testid=lang-fr]')?.getAttribute('aria-pressed') === 'true'",
      "French to be selected",
    );
    await app.until("return document.documentElement.classList.contains('dark')", "the dark theme");
    assert.match(readFileSync(settings, "utf8"), /"theme": "dark"/);
  });
});

describe("a remembered file that disappeared", () => {
  it("shows the missing path, greys out Resume, and creates nothing", async () => {
    await app.quit();
    renameSync(fam, join(work, "family-renamed.gigi"));
    const before = readdirSync(work).sort();
    app = await launch();
    assert.ok((await app.text("error")).includes(fam));
    assert.equal(await app.count("resume"), 1);
    assert.equal(await app.disabled("resume"), true);
    assert.deepEqual(readdirSync(work).sort(), before);
  });
});

mkdirSync(work, { recursive: true });
