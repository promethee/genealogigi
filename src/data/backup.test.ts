import { describe, expect, it } from "vitest";
import {
  backupPath,
  fileNameOf,
  hashText,
  sha256Fallback,
  shortHash,
  timestamp,
} from "./backup.ts";

const ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("hashing", () => {
  it("matches the known SHA-256 vectors (Web Crypto and the fallback)", async () => {
    expect(await hashText("abc")).toBe(ABC);
    expect(await hashText("")).toBe(EMPTY);
    const enc = new TextEncoder();
    expect(sha256Fallback(enc.encode("abc"))).toBe(ABC);
    expect(sha256Fallback(enc.encode(""))).toBe(EMPTY);
  });

  it("agrees between the two implementations on longer and non-ASCII text", async () => {
    const samples = [
      "a".repeat(55),
      "a".repeat(56), // padding boundary
      "a".repeat(64),
      "a".repeat(1000),
      'François Châteauÿ — "naïve" ☺ \n\t{"people":[]}',
      JSON.stringify({
        schemaVersion: 1,
        people: Array.from({ length: 200 }, (_, i) => ({ id: i })),
      }),
    ];
    for (const text of samples) {
      expect(sha256Fallback(new TextEncoder().encode(text))).toBe(await hashText(text));
    }
  });

  it("changes with any change to the text", async () => {
    expect(await hashText("family")).not.toBe(await hashText("family "));
    expect(shortHash(ABC)).toBe("ba7816bf");
  });
});

describe("timestamp", () => {
  it("is local, zero-padded yyyyMMdd-HHmmss", () => {
    expect(timestamp(new Date(2026, 9, 18, 14, 30, 55))).toBe("20261018-143055");
    expect(timestamp(new Date(2026, 0, 2, 3, 4, 5))).toBe("20260102-030405");
  });
});

describe("backupPath", () => {
  const date = new Date(2026, 9, 18, 14, 30, 55);

  it("sits next to the file: name, .backup-date-time-hash8, .json", () => {
    expect(backupPath("C:\\Users\\f\\family.json", date, ABC)).toBe(
      "C:\\Users\\f\\family.backup-20261018-143055-ba7816bf.json",
    );
    expect(backupPath("/home/f/Family Tree.json", date, ABC)).toBe(
      "/home/f/Family Tree.backup-20261018-143055-ba7816bf.json",
    );
  });

  it("handles a bare name, no extension and several dots", () => {
    expect(backupPath("family.json", date, ABC)).toBe(
      "family.backup-20261018-143055-ba7816bf.json",
    );
    expect(backupPath("/x/family", date, ABC)).toBe(
      "/x/family.backup-20261018-143055-ba7816bf.json",
    );
    expect(backupPath("/x/my.family.json", date, ABC)).toBe(
      "/x/my.family.backup-20261018-143055-ba7816bf.json",
    );
  });

  it("keeps mixed slash styles of the folder as they were", () => {
    expect(backupPath("C:/families\\smith.json", date, ABC)).toBe(
      "C:/families\\smith.backup-20261018-143055-ba7816bf.json",
    );
  });

  it("names the file with fileNameOf", () => {
    expect(fileNameOf("C:\\a\\b\\f.json")).toBe("f.json");
    expect(fileNameOf("/a/b/f.json")).toBe("f.json");
    expect(fileNameOf("f.json")).toBe("f.json");
  });
});
