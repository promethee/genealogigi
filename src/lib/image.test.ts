import { describe, expect, it } from "vitest";
import { fitWithin } from "./image.ts";

describe("fitWithin", () => {
  it("leaves small images alone", () => {
    expect(fitWithin(300, 200)).toEqual({ width: 300, height: 200 });
    expect(fitWithin(480, 480)).toEqual({ width: 480, height: 480 });
  });

  it("scales the longest side down to 480, keeping the ratio", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 480, height: 360 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 360, height: 480 });
    expect(fitWithin(481, 481)).toEqual({ width: 480, height: 480 });
  });

  it("never returns a zero side", () => {
    expect(fitWithin(100000, 10)).toEqual({ width: 480, height: 1 });
  });

  it("honours a custom maximum", () => {
    expect(fitWithin(1000, 500, 100)).toEqual({ width: 100, height: 50 });
  });
});
