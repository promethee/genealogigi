import { describe, expect, it, vi } from "vitest";
import { RELEASES_PAGE } from "../appInfo.ts";
import { checkForUpdate, isNewerVersion, parseVersion } from "./update.ts";

describe("parseVersion", () => {
  it("parses plain, v-prefixed and pre-release versions", () => {
    expect(parseVersion("1.2.3")).toEqual({ numbers: [1, 2, 3], pre: "" });
    expect(parseVersion("v10.0.1")).toEqual({ numbers: [10, 0, 1], pre: "" });
    expect(parseVersion("1.2.3-beta.1")).toEqual({ numbers: [1, 2, 3], pre: "beta.1" });
    expect(parseVersion(" 1.2.3+build5 ")).toEqual({ numbers: [1, 2, 3], pre: "" });
  });

  it("rejects anything else", () => {
    for (const bad of ["", "1.2", "latest", "1.2.x", "1.2.3.4", "v"]) {
      expect(parseVersion(bad), bad).toBeNull();
    }
  });
});

describe("isNewerVersion", () => {
  it("compares numbers, not strings", () => {
    expect(isNewerVersion("0.2.0", "0.1.0")).toBe(true);
    expect(isNewerVersion("0.10.0", "0.9.0")).toBe(true);
    expect(isNewerVersion("1.0.0", "0.99.99")).toBe(true);
    expect(isNewerVersion("0.1.1", "0.1.0")).toBe(true);
  });

  it("is false for equal or older versions", () => {
    expect(isNewerVersion("0.1.0", "0.1.0")).toBe(false);
    expect(isNewerVersion("0.1.0", "0.2.0")).toBe(false);
    expect(isNewerVersion("v0.1.0", "0.1.0")).toBe(false);
  });

  it("treats a release as newer than its own pre-release, never the reverse", () => {
    expect(isNewerVersion("1.0.0", "1.0.0-beta.1")).toBe(true);
    expect(isNewerVersion("1.0.0-beta.1", "1.0.0")).toBe(false);
    expect(isNewerVersion("1.0.0-beta.2", "1.0.0-beta.1")).toBe(true);
    expect(isNewerVersion("1.0.0-beta.10", "1.0.0-beta.2")).toBe(true);
    expect(isNewerVersion("1.0.0-beta.1", "1.0.0-beta.1")).toBe(false);
  });

  it("is false when either side cannot be parsed", () => {
    expect(isNewerVersion("nightly", "0.1.0")).toBe(false);
    expect(isNewerVersion("0.2.0", "dev")).toBe(false);
  });
});

function reply(status: number, body: unknown) {
  return vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));
}

describe("checkForUpdate", () => {
  it("reports a newer release with its page", async () => {
    const fetchFn = reply(200, {
      tag_name: "v0.2.0",
      html_url: "https://github.com/promethee/genealogigi/releases/tag/v0.2.0",
    });
    expect(await checkForUpdate(fetchFn, "0.1.0")).toEqual({
      status: "available",
      latest: "0.2.0",
      url: "https://github.com/promethee/genealogigi/releases/tag/v0.2.0",
    });
    // A read of public data: a GET with an Accept header and no body, no family data.
    const [, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      { headers: object; body?: unknown },
    ];
    expect(init.body).toBeUndefined();
  });

  it("is current when the release is the same or older", async () => {
    expect(await checkForUpdate(reply(200, { tag_name: "v0.1.0" }), "0.1.0")).toEqual({
      status: "current",
    });
    expect(await checkForUpdate(reply(200, { tag_name: "v0.0.9" }), "0.1.0")).toEqual({
      status: "current",
    });
  });

  it("treats no release yet (404) as current", async () => {
    expect(await checkForUpdate(reply(404, {}), "0.1.0")).toEqual({ status: "current" });
  });

  it("fails quietly on server errors, bad payloads and network errors", async () => {
    expect(await checkForUpdate(reply(500, {}), "0.1.0")).toEqual({ status: "failed" });
    expect(await checkForUpdate(reply(403, {}), "0.1.0")).toEqual({ status: "failed" });
    expect(await checkForUpdate(reply(200, { tag_name: 5 }), "0.1.0")).toEqual({
      status: "failed",
    });
    expect(await checkForUpdate(reply(200, { tag_name: "nightly" }), "0.1.0")).toEqual({
      status: "failed",
    });
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await checkForUpdate(offline, "0.1.0")).toEqual({ status: "failed" });
  });

  it("only ever points at GitHub", async () => {
    const result = await checkForUpdate(
      reply(200, { tag_name: "v0.2.0", html_url: "https://evil.example/download" }),
      "0.1.0",
    );
    expect(result).toMatchObject({ status: "available", url: RELEASES_PAGE });
  });

  it("gives up after the timeout", async () => {
    vi.useFakeTimers();
    try {
      const hanging = vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise<never>((_, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      );
      const pending = checkForUpdate(hanging as never, "0.1.0");
      await vi.advanceTimersByTimeAsync(5001);
      expect(await pending).toEqual({ status: "failed" });
    } finally {
      vi.useRealTimers();
    }
  });
});
