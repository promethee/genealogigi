// Photos against the real app: the real file reads, the real image decoding and resizing in the
// real webview, and the real saved file. The image picker is answered by the dev-only seam.
import { Buffer } from "node:buffer";
import { crc32, deflateSync } from "node:zlib";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { launch, startStack } from "./harness.mjs";

const work = mkdtempSync(join(tmpdir(), "gigi-real-photos-"));
const fam = join(work, "family.gigi");
const exported = join(work, "export.gigi");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** A real PNG with a gradient (so it compresses), no image library needed. */
function makePng(path, width, height) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      raw[row + 1 + x * 3] = (x * 255) / width;
      raw[row + 2 + x * 3] = (y * 255) / height;
      raw[row + 3 + x * 3] = 128;
    }
  }
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

/** Width and height of a JPEG, from its start-of-frame marker. */
function jpegSize(dataUrl) {
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  for (let i = 2; i < bytes.length;) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xc3)
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  return null;
}

const big = join(work, "big.png"); // a "phone photo": 3000 x 2000
const small = join(work, "small.png");
const fake = join(work, "fake.png"); // text pretending to be an image
makePng(big, 3000, 2000);
makePng(small, 100, 100);
writeFileSync(fake, "this is not an image");

let stop;
let app;

before(async () => {
  stop = await startStack();
  app = await launch();
  await app.answerDialogs({ save: [fam] });
  await app.click("create");
  await app.wait("loaded-path");
  await app.click("add-person");
  await app.type("first-name", "Ada");
  await app.click("submit-person");
  await app.wait("person-row");
  await app.click("view-person");
  await app.wait("photos-empty");
});

after(async () => {
  await app?.quit();
  await stop?.();
});

const savedPhotos = () => readJson(fam).people[0].photos ?? [];

describe("photos", () => {
  it("two picked images are shrunk to small JPEGs inside the family file", async () => {
    const before = statSync(fam).size;
    await app.answerDialogs({ images: [[big, small]] });
    await app.click("photo-add");
    await app.until(
      "return document.querySelectorAll('[data-testid=photo-thumb]').length === 2",
      "two thumbnails",
    );
    const photos = savedPhotos();
    assert.equal(photos.length, 2);
    for (const photo of photos) {
      assert.match(photo.dataUrl, /^data:image\/jpeg;base64,/);
      const size = jpegSize(photo.dataUrl);
      assert.ok(Math.max(size.width, size.height) <= 480, `too big: ${size.width}x${size.height}`);
    }
    const bigSize = jpegSize(photos[0].dataUrl);
    assert.equal(bigSize.width, 480); // 3000x2000 -> 480x320, proportions kept
    assert.equal(bigSize.height, 320);
    const grown = statSync(fam).size - before;
    assert.ok(grown < 300_000, `the file grew by ${grown} bytes, not by the original sizes`);
    assert.equal(await app.count("photo-main-badge"), 1);
  });

  it("the viewer pages through photos; a caption is saved to the file", async () => {
    await app.click("photo-thumb");
    await app.wait("photo-viewer");
    assert.match(await app.text("viewer-count"), /1\s*\/\s*2/);
    await app.click("viewer-next");
    assert.match(await app.text("viewer-count"), /2\s*\/\s*2/);
    await app.type("viewer-caption", "Summer 1998");
    await app.click("viewer-save-caption");
    const end = Date.now() + 10_000;
    while (savedPhotos()[1]?.caption !== "Summer 1998") {
      assert.ok(Date.now() < end, "the caption was not saved");
      await new Promise((r) => setTimeout(r, 200));
    }
  });

  it("Make main moves the second photo first", async () => {
    const second = savedPhotos()[1].id;
    await app.click("viewer-make-main");
    const end = Date.now() + 10_000;
    while (savedPhotos()[0]?.id !== second) {
      assert.ok(Date.now() < end, "the photo did not become the main one");
      await new Promise((r) => setTimeout(r, 200));
    }
    await app.click("viewer-close");
    await app.gone("photo-viewer");
  });

  it("Remove: Cancel keeps the photo, Confirm removes it from the file", async () => {
    await app.click("photo-thumb");
    await app.wait("photo-viewer");
    await app.click("viewer-remove");
    await app.click("confirm-cancel");
    await app.gone("confirm-dialog");
    assert.equal(savedPhotos().length, 2);
    await app.click("viewer-remove");
    await app.click("confirm-ok");
    await app.until(
      "return document.querySelectorAll('[data-testid=photo-thumb]').length === 1",
      "one thumbnail",
    );
    assert.equal(savedPhotos().length, 1);
    if ((await app.count("viewer-close")) > 0) await app.click("viewer-close");
  });

  it("Export keeps the photos", async () => {
    await app.answerDialogs({ save: [exported] });
    await app.click("export");
    await app.wait("notice");
    assert.equal(readJson(exported).people[0].photos.length, 1);
  });

  it("bad files are skipped with a message; the good one is added", async () => {
    await app.answerDialogs({ images: [[fake, small]] });
    await app.click("photo-add");
    await app.until(
      "return document.querySelectorAll('[data-testid=photo-thumb]').length === 2",
      "two thumbnails",
    );
    assert.match(await app.text("error"), /not a supported image/i);
    assert.equal(savedPhotos().length, 2);
  });

  it("the 12-photo limit disables Add", async () => {
    await app.answerDialogs({ images: [Array(10).fill(small)] });
    await app.click("photo-add");
    await app.until(
      "return document.querySelectorAll('[data-testid=photo-thumb]').length === 12",
      "twelve thumbnails",
    );
    assert.equal(await app.disabled("photo-add"), true);
    assert.equal(savedPhotos().length, 12);
  });

  it("the photos are still there after a real restart", async () => {
    await app.quit();
    app = await launch();
    await app.resume();
    await app.wait("loaded-path");
    await app.click("tab-list").catch(() => {});
    await app.clickInRow("person-row", "Ada", "view-person");
    await app.until(
      "return document.querySelectorAll('[data-testid=photo-thumb]').length === 12",
      "twelve thumbnails after the restart",
    );
  });
});
