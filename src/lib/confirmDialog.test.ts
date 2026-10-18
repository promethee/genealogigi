import { describe, expect, it } from "vitest";
import { answerConfirm, askConfirm, pendingConfirm } from "./confirmDialog.ts";

describe("confirm dialog service", () => {
  it("resolves with the answer and closes", async () => {
    const answer = askConfirm("Sure?");
    expect(pendingConfirm.value?.message).toBe("Sure?");
    answerConfirm(true);
    expect(await answer).toBe(true);
    expect(pendingConfirm.value).toBeNull();
  });

  it("cancels the previous question when a new one arrives", async () => {
    const first = askConfirm("one");
    const second = askConfirm("two");
    expect(await first).toBe(false);
    answerConfirm(true);
    expect(await second).toBe(true);
  });
});
