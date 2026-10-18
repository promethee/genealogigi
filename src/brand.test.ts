import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TREE_ICON_PATH } from "./brand.ts";

describe("brand", () => {
  it("the project page draws the same tree as the app", () => {
    const page = readFileSync("docs/index.html", "utf8");
    // Prettier may re-wrap the markup, so compare the path data itself.
    expect(page.split(TREE_ICON_PATH).length - 1).toBeGreaterThanOrEqual(2); // logo and favicon
  });

  it("is one trunk that splits into two and then four branches", () => {
    const segments = TREE_ICON_PATH.match(/[ML]\d+ \d+/g) ?? [];
    const tips = segments.filter((s) => s.endsWith(" 4")); // the four branch tips at the top
    expect(tips).toHaveLength(4);
    expect(TREE_ICON_PATH.startsWith("M12 21")).toBe(true); // one trunk at the bottom
    expect(TREE_ICON_PATH.match(/M12 15/g)).toHaveLength(2); // the two first branches leave the trunk top
  });
});
