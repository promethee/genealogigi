import { describe, expect, it } from "vitest";
import { addPerson } from "./people.ts";
import { renderShareHtml, safeJson } from "./shareHtml.ts";
import { buildShareModel } from "./shareModel.ts";
import type { FamilyData } from "./types.ts";

const empty: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
const today = new Date("2026-10-18T12:00:00Z");

describe("safeJson", () => {
  it("cannot close a script element or open a comment", () => {
    const out = safeJson({ a: "</script><!-- &    " });
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<!--");
    expect(out).not.toContain(" ");
    expect(JSON.parse(out).a).toBe("</script><!-- &    ");
  });
});

describe("renderShareHtml", () => {
  const data = addPerson(empty, {
    firstName: "Ada",
    lastName: "Byron",
    notes: "Line 1\nLine 2",
    birth: { year: "1815", month: "12", day: "10" },
  });
  const html = renderShareHtml(
    buildShareModel(data, { title: "Byron <family>", lang: "en", today }),
  );

  it("is one self-contained document with the data inside and no network references", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Ada Byron");
    expect(html).not.toMatch(/(src|href)="https?:/i);
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/url\(https?:/i);
  });

  it("escapes the title in the markup", () => {
    expect(html).toContain("<title>Byron &lt;family&gt;</title>");
    expect(html).not.toContain("<title>Byron <family>");
  });

  it("keeps hostile names inert: only one data block and two scripts exist", () => {
    const hostile = addPerson(empty, {
      firstName: "</script><img src=x onerror=alert(1)>",
      lastName: "",
    });
    const out = renderShareHtml(buildShareModel(hostile, { title: "t", lang: "en", today }));
    expect(out.match(/<script/g)).toHaveLength(2);
    expect(out).not.toContain("<img src=x");
  });
});
