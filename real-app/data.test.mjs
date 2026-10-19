// More of the former manual list, against the real app and the real disk: what the saved file
// contains, what survives a restart, deletes with their native-style confirmation, and a failing
// save. Run with `npm run test:real`.
import { chmodSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { launch, startStack } from "./harness.mjs";

const work = mkdtempSync(join(tmpdir(), "gigi-real-data-files-"));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

let stop;
let app;
let file; // the family file of the current describe block

before(async () => {
  stop = await startStack();
  app = await launch();
});

after(async () => {
  await app?.quit();
  await stop?.();
});

/** Quits and starts the app again (a real restart), then resumes the remembered family. */
async function restartAndResume() {
  await app.quit();
  app = await launch();
  await app.resume();
  await app.wait("loaded-path");
}

/** Starts a fresh family file from the welcome screen (closing the open one if needed). */
async function newFamily(name) {
  if ((await app.count("close-family")) > 0) await app.click("close-family");
  file = join(work, `${name}.gigi`);
  await app.answerDialogs({ save: [file] });
  await app.click("create");
  await app.wait("loaded-path");
}

async function addPerson(first, last = "", more = async () => {}) {
  await app.click("add-person");
  if (first) await app.type("first-name", first);
  if (last) await app.type("last-name", last);
  await more();
  await app.click("submit-person");
}

const rows = async () => (await app.all("person-row")).length;

describe("people: saved file, restart, delete", () => {
  it("a new family shows the empty message", async () => {
    await newFamily("people");
    assert.match(await app.text("empty-state"), /No people yet/);
  });

  it("dates and a deceased status are written the way the file format says", async () => {
    await addPerson("Ada", "Lovelace", async () => {
      await app.type("birth-year", "1815");
      await app.select("birth-month", "12");
      await app.type("birth-day", "10");
      await app.select("life-status", "deceased");
      await app.type("death-year", "1852");
      await app.select("death-month", "11");
      await app.type("death-day", "27");
    });
    await app.wait("person-row");
    assert.match(await app.text("person-name"), /Ada Lovelace/);
    assert.equal(await app.text("person-life"), "born 10 Dec 1815 · died 27 Nov 1852");
    assert.match(await app.text("loaded-summary"), /1 person/);

    const ada = readJson(file).people[0];
    assert.equal(ada.names.firstNames[0].value, "Ada");
    assert.equal(ada.names.firstNames[0].kind, "birth");
    assert.equal(ada.born.birthDate.raw.slice(0, 10), "1815-12-10");
    assert.deepEqual(
      [ada.born.birthDate.yearKnown, ada.born.birthDate.monthKnown, ada.born.birthDate.dayKnown],
      [true, true, true],
    );
    assert.equal(ada.lifeStatus.living, false);
    assert.equal(ada.lifeStatus.dateOfDeath.raw.slice(0, 10), "1852-11-27");
  });

  it("a last name alone is enough; no name at all is refused", async () => {
    await addPerson("", "Byron");
    await app.until(
      "return document.querySelectorAll('[data-testid=person-row]').length === 2",
      "two rows",
    );
    await addPerson("", "");
    assert.match(await app.text("error"), /At least one name is required/);
    assert.equal(readJson(file).people.length, 2);
  });

  it("both people are still there after a real restart", async () => {
    await restartAndResume();
    await app.wait("person-row");
    assert.equal(await rows(), 2);
    assert.equal(readJson(file).people.length, 2);
  });

  it("delete: Cancel keeps the person, Confirm removes them from the file", async () => {
    await app.clickInRow("person-row", "Byron", "view-person");
    await app.click("detail-delete");
    await app.click("confirm-cancel");
    await app.gone("confirm-dialog");
    assert.equal(await rows(), 2);
    assert.equal(readJson(file).people.length, 2);

    await app.click("detail-delete");
    await app.click("confirm-ok");
    await app.until(
      "return document.querySelectorAll('[data-testid=person-row]').length === 1",
      "one row",
    );
    assert.equal(readJson(file).people.length, 1);
  });
});

describe("relationships: saved file, restart, delete, cascade", () => {
  it("a parent link is saved; the reverse is refused as a cycle", async () => {
    await newFamily("relationships");
    for (const name of ["Ada", "Byron", "Cleo"]) await addPerson(name);
    await app.until(
      "return document.querySelectorAll('[data-testid=person-row]').length === 3",
      "three rows",
    );
    await app.select("rel-kind", "parent");
    await app.select("rel-first", "Ada");
    await app.select("rel-second", "Byron");
    await app.click("rel-add");
    await app.wait("relationship-row");
    const link = readJson(file).relationships[0];
    assert.equal(link.nature, "biological-confirmed");

    await app.select("rel-first", "Byron");
    await app.select("rel-second", "Ada");
    await app.click("rel-add");
    assert.match(await app.text("error"), /cycle/i);
    assert.equal(readJson(file).relationships.length, 1);
  });

  it("a step link with status and dates is written with those dates", async () => {
    await app.select("rel-first", "Ada");
    await app.select("rel-second", "Cleo");
    await app.select("rel-nature", "step");
    await app.select("rel-link-status", "ended");
    await app.type("rel-start-year", "1990");
    await app.type("rel-end-year", "1995");
    await app.click("rel-add");
    await app.until(
      "return document.querySelectorAll('[data-testid=relationship-row]').length === 2",
      "two links",
    );
    const step = readJson(file).relationships.find((r) => r.nature === "step");
    assert.equal(step.status, "ended");
    assert.equal(step.startDate.raw.slice(0, 4), "1990");
    assert.equal(step.endDate.raw.slice(0, 4), "1995");
  });

  it("both links survive a real restart", async () => {
    await restartAndResume();
    await app.click("tab-list"); // a family with relationships opens on the Tree tab
    await app.wait("relationship-row");
    assert.equal((await app.all("relationship-row")).length, 2);
  });

  it("delete a link: Cancel keeps it, Confirm removes it from the file", async () => {
    await app.click("delete-relationship");
    await app.click("confirm-cancel");
    await app.gone("confirm-dialog");
    assert.equal(readJson(file).relationships.length, 2);
    await app.click("delete-relationship");
    await app.click("confirm-ok");
    await app.until(
      "return document.querySelectorAll('[data-testid=relationship-row]').length === 1",
      "one link",
    );
    assert.equal(readJson(file).relationships.length, 1);
  });

  it("deleting a person warns about their links and removes them from the file", async () => {
    await app.clickInRow("person-row", "Ada", "view-person");
    await app.click("detail-delete");
    assert.match(await app.text("confirm-message"), /1 relationship/);
    await app.click("confirm-ok");
    await app.until(
      "return document.querySelectorAll('[data-testid=person-row]').length === 2",
      "two people",
    );
    assert.equal(readJson(file).relationships.length, 0);
  });
});

describe("names and events: saved file and restart", () => {
  it("a married name is stored with its kind and year", async () => {
    await newFamily("names");
    await addPerson("Marie", "Martin", async () => {
      await app.click("add-last-name");
      await app.typeNth("last-name", 1, "Dubois");
      await app.select("last-name-kind", "married", 1);
      await app.typeNth("last-name-year", 1, "2001");
    });
    await app.wait("person-row");
    assert.match(await app.text("person-name"), /Marie Dubois \(née Martin\)/);
    const names = readJson(file).people[0].names.lastNames;
    assert.deepEqual(
      names.map((n) => n.kind),
      ["birth", "married"],
    );
    assert.equal(names[1].date.yearKnown, true);
    assert.equal(names[1].date.raw.slice(0, 4), "2001");
  });

  it("editing only the birth date keeps both names", async () => {
    await app.clickInRow("person-row", "Marie", "view-person");
    await app.click("detail-edit");
    await app.type("birth-year", "1975");
    await app.click("submit-person");
    await app.wait("detail-name");
    const person = readJson(file).people[0];
    assert.equal(person.names.lastNames.length, 2);
    assert.equal(person.born.birthDate.raw.slice(0, 4), "1975");
  });

  it("an event is saved to the file and is still on the card after a restart", async () => {
    await app.click("event-add");
    await app.select("event-kind", "marriage");
    await app.type("event-date-year", "2002");
    await app.type("event-place", "Lyon");
    await app.click("event-save");
    await app.until(
      "return [...document.querySelectorAll('[data-testid=timeline-text]')].some((e) => e.textContent.includes('Marriage'))",
      "the marriage on the timeline",
    );
    const saved = readJson(file);
    assert.equal(saved.events.length, 1);
    assert.equal(saved.events[0].place, "Lyon");
    assert.ok(saved.events[0].personIds.includes(saved.people[0].id));

    await restartAndResume();
    await app.clickInRow("person-row", "Marie", "view-person");
    await app.until(
      "return [...document.querySelectorAll('[data-testid=timeline-text]')].some((e) => e.textContent.includes('Marriage'))",
      "the marriage after the restart",
    );
  });
});

describe("the interface language never leaks into the file", () => {
  it("using French writes no French text", async () => {
    await newFamily("french");
    await app.click("lang-fr");
    await addPerson("Zoé", "Moreau", async () => {
      await app.type("birth-year", "1990");
    });
    await app.wait("person-row");
    const raw = readFileSync(file, "utf8");
    assert.doesNotMatch(raw, /Naissance|principal|vivant|décéd/i);
    assert.equal(JSON.parse(raw).people[0].names.firstNames[0].kind, "birth");
    await app.click("lang-en");
  });
});

describe(
  "a save that fails",
  { skip: process.getuid?.() === 0 ? "root ignores folder permissions" : false },
  () => {
    it("shows an error, lists nothing new and leaves the file alone", async () => {
      await newFamily("readonly");
      await addPerson("Ada");
      await app.wait("person-row");
      const before = readFileSync(file, "utf8");
      const dir = work;
      const mode = statSync(dir).mode;
      chmodSync(dir, 0o555); // no new files: the atomic save cannot write its temporary file
      try {
        await addPerson("Byron");
        await app.wait("error");
        assert.equal(await rows(), 1);
        assert.equal(readFileSync(file, "utf8"), before);
      } finally {
        chmodSync(dir, mode);
      }
    });
  },
);
