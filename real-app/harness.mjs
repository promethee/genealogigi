// Drives the REAL Tauri app (not the browser fake) through WebDriver: real window, real files,
// real settings store, real restarts. Native file dialogs are answered by a dev-only seam
// (`window.__GENEALOGIGI_TEST_DIALOGS__`), everything after the dialog is genuine.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ELEMENT = "element-6066-11e4-a52e-4f735466cecf";
const DRIVER = "http://127.0.0.1:4444";
const APP = process.env.GENEALOGIGI_BIN ?? join(root, "src-tauri/target/debug/genealogigi");
export const dataHome = mkdtempSync(join(tmpdir(), "gigi-real-data-"));

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
export async function startStack() {
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
  };
  run(join(root, "node_modules/.bin/vite"), ["--port", "5173", "--strictPort"]);
  await waitFor(async () => (await fetch("http://localhost:5173")).ok, "the dev server");
  const nativeDriver = process.env.NATIVE_DRIVER ?? "/usr/bin/WebKitWebDriver";
  run("tauri-driver", ["--native-driver", nativeDriver], isolated);
  await waitFor(async () => (await fetch(`${DRIVER}/status`)).ok, "tauri-driver");
  return async () => {
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
    await this.cmd("POST", `/element/${el}/click`, {});
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

  /** Answers the next native file dialogs: paths (or null = cancel), consumed in order. */
  async answerDialogs({ open = [], save = [] }) {
    await this.eval(
      "window.__GENEALOGIGI_TEST_DIALOGS__ = { open: arguments[0], save: arguments[1] };",
      open,
      save,
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
