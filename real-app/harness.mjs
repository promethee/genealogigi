// Drives the REAL Tauri app (not the browser fake) through WebDriver: real window, real files,
// real settings store, real restarts. Native file dialogs are answered by a dev-only seam
// (`window.__GENEALOGIGI_TEST_DIALOGS__`), everything after the dialog is genuine.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ELEMENT = "element-6066-11e4-a52e-4f735466cecf";
const DRIVER = "http://127.0.0.1:4444";
const APP = process.env.GENEALOGIGI_BIN ?? join(root, "src-tauri/target/debug/genealogigi");
export const dataHome = mkdtempSync(join(tmpdir(), "gigi-real-data-"));

/** Where the stubbed browser opener (xdg-open) records the addresses it was asked to open. */
export const openLog = join(dataHome, "opened-urls.log");

/**
 * A fake GitHub "latest release" endpoint. `mode`: "none" (404, no release yet), "release"
 * (a release tagged `tag`) or "down" (the connection is cut, like no network).
 */
export const mock = { mode: "none", tag: "v9.9.9", port: 5174, hits: 0 };

/** The latest-release address the app is pointed to, and the page the release links to. */
export const releasePage = () =>
  `https://github.com/promethee/genealogigi/releases/tag/${mock.tag}`;

function startMock() {
  const server = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    mock.hits += 1;
    if (mock.mode === "down") return req.socket.destroy();
    if (mock.mode === "none") {
      res.statusCode = 404;
      return res.end("{}");
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ tag_name: mock.tag, html_url: releasePage() }));
  });
  return new Promise((resolve) => server.listen(mock.port, "127.0.0.1", () => resolve(server)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(check, what, timeout = 60_000) {
  const end = Date.now() + timeout;
  for (;;) {
    try {
      const value = await check();
      if (value) return value;
    } catch {
      // not ready yet
    }
    if (Date.now() > end) throw new Error(`Timed out waiting for ${what}`);
    await sleep(250);
  }
}

const children = [];
function run(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.output = "";
  child.stdout.on("data", (d) => (child.output += d));
  child.stderr.on("data", (d) => (child.output += d));
  children.push(child);
  return child;
}

/** Starts the dev web server and tauri-driver; returns a function that stops them. */
export async function startStack(extraEnv = {}) {
  if (!existsSync(APP)) {
    throw new Error(
      `App binary not found: ${APP}. Build it first: cargo build --manifest-path src-tauri/Cargo.toml`,
    );
  }
  const isolated = {
    XDG_DATA_HOME: join(dataHome, "data"),
    XDG_CONFIG_HOME: join(dataHome, "config"),
    XDG_CACHE_HOME: join(dataHome, "cache"),
    WEBKIT_DISABLE_COMPOSITING_MODE: "1",
    ...extraEnv,
  };
  const mockServer = await startMock();
  // A stand-in for the system browser: record what the app asks to open instead of opening it.
  const binDir = join(dataHome, "bin");
  mkdirSync(binDir, { recursive: true });
  const stub = join(binDir, "xdg-open");
  writeFileSync(stub, `#!/bin/sh\necho "$@" >> "${openLog}"\n`);
  chmodSync(stub, 0o755);
  isolated.PATH = `${binDir}:${process.env.PATH}`;
  run(join(root, "node_modules/.bin/vite"), ["--port", "5173", "--strictPort"], {
    VITE_GENEALOGIGI_RELEASES_URL: `http://127.0.0.1:${mock.port}/latest`,
  });
  await waitFor(async () => (await fetch("http://localhost:5173")).ok, "the dev server");
  const nativeDriver = process.env.NATIVE_DRIVER ?? "/usr/bin/WebKitWebDriver";
  run("tauri-driver", ["--native-driver", nativeDriver], isolated);
  await waitFor(async () => (await fetch(`${DRIVER}/status`)).ok, "tauri-driver");
  return async () => {
    mockServer.close();
    for (const child of children) child.kill("SIGTERM");
    await sleep(500);
  };
}

class Session {
  constructor(id) {
    this.id = id;
  }

  async cmd(method, path, body) {
    const res = await fetch(`${DRIVER}/session/${this.id}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(`${method} ${path}: ${json.value?.error} ${json.value?.message ?? ""}`);
    return json.value;
  }

  css(testId) {
    return `[data-testid="${testId}"]`;
  }

  async find(testId) {
    const el = await this.cmd("POST", "/element", {
      using: "css selector",
      value: this.css(testId),
    });
    return el[ELEMENT];
  }

  /** Clicks Resume once the remembered file has been found (it is read after the first screen). */
  async resume() {
    await this.until(
      "return document.querySelector('[data-testid=resume]')?.disabled === false",
      "Resume to be enabled",
    );
    await this.click("resume");
  }

  /** What the stubbed browser opener has been asked to open so far. */
  openedUrls() {
    return existsSync(openLog) ? readFileSync(openLog, "utf8").split("\n").filter(Boolean) : [];
  }

  /** Waits for an element to exist and returns its id. */
  async wait(testId, timeout = 20_000) {
    return waitFor(() => this.find(testId), `[${testId}]`, timeout);
  }

  async count(testId) {
    return (await this.cmd("POST", "/elements", { using: "css selector", value: this.css(testId) }))
      .length;
  }

  async gone(testId, timeout = 10_000) {
    return waitFor(
      async () => (await this.count(testId)) === 0,
      `[${testId}] to disappear`,
      timeout,
    );
  }

  async click(testId) {
    const el = await this.wait(testId);
    // The page scrolls inside the window: bring the target to the middle so the click lands on it.
    await this.eval("arguments[0].scrollIntoView({ block: 'center' });", { [ELEMENT]: el });
    try {
      await this.cmd("POST", `/element/${el}/click`, {});
    } catch (err) {
      // A tooltip or an animating overlay can briefly cover the target: click it directly.
      if (!/intercepted/.test(String(err.message))) throw err;
      await this.eval("arguments[0].click();", { [ELEMENT]: el });
    }
  }

  async type(testId, text) {
    const el = await this.wait(testId);
    await this.cmd("POST", `/element/${el}/clear`, {});
    await this.cmd("POST", `/element/${el}/value`, { text });
  }

  async text(testId) {
    const el = await this.wait(testId);
    // textContent, not WebDriver's visible text: it is empty for truncated or clipped elements.
    return ((await this.cmd("GET", `/element/${el}/property/textContent`)) ?? "").trim();
  }

  async disabled(testId) {
    const el = await this.wait(testId);
    return (await this.cmd("GET", `/element/${el}/property/disabled`)) === true;
  }

  async attr(testId, name) {
    const el = await this.wait(testId);
    return this.cmd("GET", `/element/${el}/attribute/${name}`);
  }

  async eval(script, ...args) {
    return this.cmd("POST", "/execute/sync", { script, args });
  }

  /** Creates a family from the welcome screen: asks the name in the in-app prompt, then saves. */
  async createFamily(path, name = "Test family") {
    await this.answerDialogs({ save: [path] });
    await this.click("create");
    await this.type("prompt-input", name);
    await this.click("prompt-ok");
    await this.wait("loaded-path");
  }

  /** Answers the next native file dialogs: paths (or null = cancel), consumed in order. */
  async answerDialogs({ open = [], save = [], images = [] }) {
    await this.eval(
      "window.__GENEALOGIGI_TEST_DIALOGS__ = { open: arguments[0], save: arguments[1], images: arguments[2] };",
      open,
      save,
      images,
    );
  }

  /** The nth element (0-based) with this test id. */
  async nth(testId, index) {
    const els = await this.cmd("POST", "/elements", {
      using: "css selector",
      value: this.css(testId),
    });
    if (!els[index]) throw new Error(`No element ${index} for [${testId}]`);
    return els[index][ELEMENT];
  }

  async typeNth(testId, index, text) {
    const el = await this.nth(testId, index);
    await this.cmd("POST", `/element/${el}/clear`, {});
    await this.cmd("POST", `/element/${el}/value`, { text });
  }

  /** Chooses an option of a <select> by value or visible label, like a user would. */
  async select(testId, valueOrLabel, index = 0) {
    await this.eval(
      `const el = document.querySelectorAll(arguments[0])[arguments[2]];
       const opt = [...el.options].find((o) => o.value === arguments[1] || o.textContent.trim() === arguments[1]);
       if (!opt) throw new Error("no option " + arguments[1]);
       el.value = opt.value;
       el.dispatchEvent(new Event("change", { bubbles: true }));`,
      this.css(testId),
      valueOrLabel,
      index,
    );
  }

  /** Texts of every element with this test id. */
  async all(testId) {
    return this.eval(
      "return [...document.querySelectorAll(arguments[0])].map((e) => e.textContent.trim());",
      this.css(testId),
    );
  }

  /** Clicks a button inside the first list row (person or relationship) containing this text. */
  async clickInRow(rowTestId, rowText, buttonTestId) {
    const done = await this.eval(
      `const row = [...document.querySelectorAll(arguments[0])].find((r) => r.textContent.includes(arguments[1]));
       const button = row && row.querySelector(arguments[2]);
       if (!button) return false;
       button.click();
       return true;`,
      this.css(rowTestId),
      rowText,
      this.css(buttonTestId),
    );
    if (!done) throw new Error(`No ${buttonTestId} in a ${rowTestId} containing "${rowText}"`);
  }

  /** Polls a script until it returns something truthy. */
  async until(script, what, timeout = 15_000) {
    return waitFor(() => this.eval(script), what, timeout);
  }

  async quit() {
    await fetch(`${DRIVER}/session/${this.id}`, { method: "DELETE" }).catch(() => {});
    await sleep(1000);
  }
}

/** Starts (or restarts) the app and waits until its first screen is up. */
export async function launch() {
  const res = await fetch(`${DRIVER}/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      capabilities: { alwaysMatch: { "tauri:options": { application: APP } } },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Could not start the app: ${JSON.stringify(json.value)}`);
  const session = new Session(json.value.sessionId ?? json.sessionId);
  await session.wait("create", 60_000);
  return session;
}
