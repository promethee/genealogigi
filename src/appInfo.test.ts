import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_TITLE, APP_VERSION } from "./appInfo.ts";

const read = (path: string) => readFileSync(path, "utf8");

describe("the app version", () => {
  const pkg = (JSON.parse(read("package.json")) as { version: string }).version;

  it("is injected from package.json", () => {
    expect(APP_VERSION).toBe(pkg);
    expect(APP_TITLE).toBe(`Genealogigi ${pkg}`);
  });

  it("is the same in tauri.conf.json and Cargo.toml", () => {
    const tauri = (JSON.parse(read("src-tauri/tauri.conf.json")) as { version: string }).version;
    const cargo = /^version\s*=\s*"([^"]+)"/m.exec(read("src-tauri/Cargo.toml"))?.[1];
    expect(tauri).toBe(pkg);
    expect(cargo).toBe(pkg);
  });
});
