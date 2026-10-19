// The update check against the real app, pointed at a local fake of GitHub's "latest release"
// endpoint (a dev-only seam), with the system browser replaced by a recorder. Real settings
// store, real restarts, real clicks.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { dataHome, launch, mock, releasePage, startStack } from "./harness.mjs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const settings = join(dataHome, "data", "app.genealogigi", "settings.json");

let stop;
let app;

/** Quits and starts the app again: the startup check runs against the current fake release. */
async function relaunch() {
  await app.quit();
  app = await launch();
}

before(async () => {
  stop = await startStack();
});

after(async () => {
  await app?.quit();
  await stop?.();
});

describe("update check", () => {
  it("no release published yet: no banner, no error", async () => {
    mock.mode = "none";
    app = await launch();
    await new Promise((r) => setTimeout(r, 2000)); // give the startup check time to finish
    assert.equal(await app.count("update-banner"), 0);
    assert.equal(await app.count("error"), 0);
  });

  it("Check for updates says you are up to date", async () => {
    await app.click("check-update");
    await app.wait("update-result");
    assert.ok((await app.text("update-result")).includes(version));
    assert.equal(await app.count("update-banner"), 0);
  });

  it("with no network: 'Could not check', no banner", async () => {
    mock.mode = "down";
    await app.click("check-update");
    await app.until(
      "return document.querySelector('[data-testid=update-result]')?.textContent.includes('Could not check')",
      "the failure message",
    );
    assert.equal(await app.count("update-banner"), 0);
  });

  it("a newer release at startup shows an invitation with the version and the link", async () => {
    mock.mode = "release";
    mock.tag = "v9.9.9";
    await relaunch();
    await app.wait("update-banner");
    const text = await app.text("update-text");
    assert.ok(text.includes("9.9.9") && text.includes(version));
    assert.match(await app.text("update-download"), /Download version 9\.9\.9/);
    assert.equal(await app.text("update-link"), releasePage());
  });

  it("Download and the link ask the system browser to open the release page", async () => {
    await app.click("update-download");
    await app.click("update-link");
    const end = Date.now() + 10_000;
    while (app.openedUrls().length < 2) {
      assert.ok(Date.now() < end, `the browser was asked ${app.openedUrls().length} time(s)`);
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.deepEqual(app.openedUrls(), [releasePage(), releasePage()]);
  });

  it("Dismiss hides the banner, and it stays hidden after a restart", async () => {
    await app.click("update-dismiss");
    await app.gone("update-banner");
    const end = Date.now() + 10_000;
    while (!(existsSync(settings) && /dismissedUpdate/.test(readFileSync(settings, "utf8")))) {
      assert.ok(Date.now() < end, "the dismissal was not saved");
      await new Promise((r) => setTimeout(r, 200));
    }
    await relaunch();
    await new Promise((r) => setTimeout(r, 2000)); // give the startup check time to finish
    assert.equal(await app.count("update-banner"), 0);
  });

  it("Check for updates shows a dismissed banner again", async () => {
    await app.click("check-update");
    await app.wait("update-banner");
  });

  it("a still newer release brings the banner back after a restart", async () => {
    await app.click("update-dismiss");
    await app.gone("update-banner");
    mock.tag = "v9.9.10";
    await relaunch();
    await app.wait("update-banner");
    assert.ok((await app.text("update-text")).includes("9.9.10"));
  });
});
