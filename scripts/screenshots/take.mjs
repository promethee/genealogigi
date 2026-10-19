// Retakes the screenshots of docs/screenshots/ from a fictional family: English and French, light and dark.
// Needs the dev server (npm run dev) and a Chromium; run: node scripts/screenshots/take.mjs
// (set PW_CHROMIUM_PATH to reuse an installed Chromium).
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const PATH = "C:/Famille/laurent.gigi";
const OUT = new URL("../../docs/screenshots/", import.meta.url).pathname;

/** The platform seam of a plain browser: files live in localStorage. */
function fakeShell() {
  const read = (key) => localStorage.getItem(key);
  window.__GENEALOGIGI_PLATFORM__ = {
    openFileDialog: async () => null,
    saveFileDialog: async () => null,
    confirm: async () => true,
    data: {
      exists: async (p) => read(`fake:file:${p}`) !== null,
      load: async (p) => JSON.parse(read(`fake:file:${p}`) ?? "null"),
      save: async (p, d) => localStorage.setItem(`fake:file:${p}`, JSON.stringify(d)),
      readRaw: async (p) => read(`fake:file:${p}`) ?? "",
      writeRaw: async (p, text) => localStorage.setItem(`fake:file:${p}`, text),
    },
    settings: {
      getLastFilePath: async () => read("fake:lastPath"),
      setLastFilePath: async (p) =>
        p === null
          ? localStorage.removeItem("fake:lastPath")
          : localStorage.setItem("fake:lastPath", p),
    },
    exit: async () => {},
  };
}

/** Builds the family with the app's own data layer (imported from the dev server). */
async function seed(page, familyName) {
  await page.evaluate(
    async ([path, familyName]) => {
      const people = await import("/src/data/people.ts");
      const rel = await import("/src/data/relationships.ts");
      let data = { schemaVersion: 1, name: familyName, people: [], relationships: [] };
      const d = (year, month = "", day = "") => ({ year, month, day });
      const ids = {};
      const add = (key, input) => {
        data = people.addPerson(data, input);
        ids[key] = data.people[data.people.length - 1].id;
      };
      const dead = (first, last, born, died, place = "", diedPlace = "") => ({
        firstName: first,
        lastName: last,
        birth: d(born),
        birthPlace: place,
        status: "deceased",
        death: d(died),
        deathPlace: diedPlace,
      });
      const alive = (first, last, born, place = "") => ({
        firstName: first,
        lastName: last,
        birth: d(born),
        birthPlace: place,
        status: "living",
      });
      add("paul", dead("Paul", "Laurent", "1930", "2009", "Lyon", "Annecy"));
      add("jeanne", {
        firstNames: [{ value: "Jeanne", kind: "birth", date: d(""), primary: true }],
        lastNames: [
          { value: "Martin", kind: "birth", date: d(""), primary: false },
          { value: "Laurent", kind: "married", date: d("1955"), primary: true },
        ],
        birth: d("1932"),
        birthPlace: "Valence",
        status: "living",
      });
      add("lucien", dead("Lucien", "Dubois", "1928", "2001", "Paris", "Paris"));
      add("simone", dead("Simone", "Girard", "1931", "2020", "Dijon", "Paris"));
      add("marc", alive("Marc", "Dubois", "1955", "Paris"));
      add("odile", alive("Odile", "Laurent", "1958", "Lyon"));
      add("camille", alive("Camille", "Laurent", "1961", "Lyon"));
      add("lea", {
        ...alive("Léa", "Dubois", "1988", "Paris"),
        notes: "Loves old family photos and Sunday lunches in Lyon.",
      });
      add("hugo", alive("Hugo", "Dubois", "1991", "Paris"));
      add("julien", alive("Julien", "Moreau", "1987", "Nantes"));
      add("ines", alive("Inès", "Moreau", "2018", "Paris"));

      const child = (parent, kid) => {
        data = rel.addParentChild(data, {
          parentId: ids[parent],
          childId: ids[kid],
          nature: "biological-confirmed",
        });
      };
      const couple = (a, b, year) => {
        data = rel.addPartners(data, {
          personAId: ids[a],
          personBId: ids[b],
          status: "ongoing",
          start: d(year),
        });
      };
      couple("paul", "jeanne", "1955");
      couple("lucien", "simone", "1952");
      couple("marc", "odile", "1985");
      couple("lea", "julien", "2015");
      for (const kid of ["odile", "camille"]) {
        child("paul", kid);
        child("jeanne", kid);
      }
      for (const parent of ["lucien", "simone"]) child(parent, "marc");
      for (const kid of ["lea", "hugo"]) {
        child("marc", kid);
        child("odile", kid);
      }
      for (const parent of ["lea", "julien"]) child(parent, "ines");

      localStorage.setItem(`fake:file:${path}`, JSON.stringify(data));
      localStorage.setItem("fake:lastPath", path);
    },
    [PATH, familyName],
  );
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
for (const [lang, suffix, familyName] of [
  ["en", "", "Laurent family"],
  ["fr", "-fr", "Famille Laurent"],
])
  for (const scheme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    });
    await context.addInitScript(fakeShell);
    const page = await context.newPage();
    await page.goto(BASE);
    await seed(page, familyName);
    await page.reload();
    await page.getByTestId("resume").click();
    await page.getByTestId("loaded-path").waitFor();
    if (lang === "fr") await page.getByTestId("lang-fr").click();
    const shot = (name, target) =>
      target.screenshot({
        path: `${OUT}${name}-${scheme}${suffix}.jpg`,
        type: "jpeg",
        quality: 88,
      });

    await page.getByTestId("tab-tree").click(); // opens on Everyone
    await page.getByTestId("tree-node").first().waitFor();
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: `${OUT}tree-${scheme}${suffix}.jpg`,
      type: "jpeg",
      quality: 88,
      fullPage: true,
    });

    await page.getByTestId("tab-list").click();
    await page.getByTestId("person-row").first().waitFor();
    await page.screenshot({
      path: `${OUT}people-${scheme}${suffix}.jpg`,
      type: "jpeg",
      quality: 88,
      fullPage: true,
    });

    await page
      .getByTestId("person-row")
      .filter({ hasText: "Léa" })
      .getByTestId("view-person")
      .click();
    await page.getByTestId("person-card").waitFor();
    await shot("card", page.getByTestId("person-card"));
    await context.close();
  }
await browser.close();
console.log("screenshots written to", OUT);
