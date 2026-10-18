import { describe, expect, it } from "vitest";
import {
  addPhotos,
  makeMainPhoto,
  mainPhotoOf,
  MAX_PHOTOS_PER_PERSON,
  removePhoto,
  setPhotoCaption,
} from "./photos.ts";
import { addPerson, removePerson } from "./people.ts";
import { createUuidId, type FamilyData, type PersonId, type PhotoId } from "./types.ts";

// A 1x1 JPEG-labelled data URL is enough: the data layer validates the shape, not the pixels.
const url = (n = 0) => `data:image/jpeg;base64,/9j/${"A".repeat(20)}${n}`;

function one(): { data: FamilyData; id: PersonId } {
  const data = addPerson(
    { schemaVersion: 1, people: [], relationships: [] },
    { firstName: "Ada", lastName: "" },
  );
  return { data, id: data.people[0]!.id };
}
const photosOf = (data: FamilyData) => data.people[0]!.photos ?? [];

describe("addPhotos", () => {
  it("adds photos in order; the first is the main one", () => {
    const { data, id } = one();
    const next = addPhotos(data, id, [
      { dataUrl: url(1) },
      { dataUrl: url(2) },
      { dataUrl: url(3) },
    ]);
    expect(photosOf(next).map((p) => p.dataUrl)).toEqual([url(1), url(2), url(3)]);
    expect(mainPhotoOf(next.people[0]!)?.dataUrl).toBe(url(1));
    const more = addPhotos(next, id, [{ dataUrl: url(4) }]);
    expect(photosOf(more)).toHaveLength(4);
    expect(mainPhotoOf(more.people[0]!)?.dataUrl).toBe(url(1)); // adding never changes the main photo
  });

  it("gives each photo its own id and trims captions, omitting empty ones", () => {
    const { data, id } = one();
    const next = addPhotos(data, id, [
      { dataUrl: url(1), caption: "  Summer 1990 " },
      { dataUrl: url(2), caption: "   " },
    ]);
    const [a, b] = photosOf(next);
    expect(a!.id).not.toBe(b!.id);
    expect(a!.caption).toBe("Summer 1990");
    expect("caption" in b!).toBe(false);
  });

  it("accepts jpeg, png and webp data URLs and nothing else", () => {
    const { data, id } = one();
    for (const type of ["jpeg", "png", "webp"]) {
      expect(() =>
        addPhotos(data, id, [{ dataUrl: `data:image/${type};base64,AAAA` }]),
      ).not.toThrow();
    }
    for (const bad of [
      "data:image/gif;base64,AAAA",
      "data:image/svg+xml;base64,AAAA",
      "data:text/html;base64,AAAA",
      "https://example.com/a.jpg",
      "javascript:alert(1)",
      "data:image/png;base64,",
      "data:image/png;base64,not base64!",
      "",
    ]) {
      expect(() => addPhotos(data, id, [{ dataUrl: bad }]), bad).toThrow("not a supported image");
    }
  });

  it("rejects a photo that is too large", () => {
    const { data, id } = one();
    expect(() =>
      addPhotos(data, id, [{ dataUrl: `data:image/jpeg;base64,${"A".repeat(1_500_000)}` }]),
    ).toThrow("too large");
  });

  it("enforces the per-person limit, all or nothing", () => {
    const { data, id } = one();
    const full = addPhotos(
      data,
      id,
      Array.from({ length: MAX_PHOTOS_PER_PERSON }, (_, i) => ({ dataUrl: url(i) })),
    );
    expect(photosOf(full)).toHaveLength(12);
    expect(() => addPhotos(full, id, [{ dataUrl: url(99) }])).toThrow("at most 12 photos");
    const nine = addPhotos(
      data,
      id,
      Array.from({ length: 9 }, (_, i) => ({ dataUrl: url(i) })),
    );
    expect(() =>
      addPhotos(
        nine,
        id,
        Array.from({ length: 4 }, (_, i) => ({ dataUrl: url(i) })),
      ),
    ).toThrow("at most 12 photos");
    expect(photosOf(nine)).toHaveLength(9);
  });

  it("adds nothing when one of several is invalid", () => {
    const { data, id } = one();
    expect(() => addPhotos(data, id, [{ dataUrl: url(1) }, { dataUrl: "nope" }])).toThrow();
    expect(data.people[0]!.photos).toBeUndefined();
  });

  it("refuses an unknown person", () => {
    const { data } = one();
    expect(() =>
      addPhotos(data, createUuidId<"PersonId">() as PersonId, [{ dataUrl: url() }]),
    ).toThrow("Person not found");
  });
});

describe("main photo, caption and removal", () => {
  const setup = () => {
    const { data, id } = one();
    const next = addPhotos(data, id, [
      { dataUrl: url(1) },
      { dataUrl: url(2) },
      { dataUrl: url(3) },
    ]);
    const ids = photosOf(next).map((p) => p.id);
    return { data: next, id, ids };
  };

  it("makes a photo the main one by moving it to the front, keeping the others' order", () => {
    const { data, id, ids } = setup();
    const next = makeMainPhoto(data, id, ids[2]!);
    expect(photosOf(next).map((p) => p.id)).toEqual([ids[2], ids[0], ids[1]]);
    expect(mainPhotoOf(next.people[0]!)?.id).toBe(ids[2]);
  });

  it("sets and clears a caption", () => {
    const { data, id, ids } = setup();
    const named = setCaption(data, id, ids[1]!, " Wedding ");
    expect(photosOf(named)[1]!.caption).toBe("Wedding");
    const cleared = setCaption(named, id, ids[1]!, "  ");
    expect("caption" in photosOf(cleared)[1]!).toBe(false);
  });

  it("removes a photo; removing the main one promotes the next", () => {
    const { data, id, ids } = setup();
    const next = removePhoto(data, id, ids[0]!);
    expect(photosOf(next).map((p) => p.id)).toEqual([ids[1], ids[2]]);
    expect(mainPhotoOf(next.people[0]!)?.id).toBe(ids[1]);
  });

  it("drops the photos field when the last photo goes", () => {
    const { data, id } = one();
    const added = addPhotos(data, id, [{ dataUrl: url() }]);
    const removed = removePhoto(added, id, photosOf(added)[0]!.id);
    expect("photos" in removed.people[0]!).toBe(false);
  });

  it("reports unknown photos and people", () => {
    const { data, id } = setup();
    const ghost = createUuidId<"PhotoId">() as PhotoId;
    expect(() => removePhoto(data, id, ghost)).toThrow("Photo not found");
    expect(() => makeMainPhoto(data, id, ghost)).toThrow("Photo not found");
    expect(() => setCaption(data, id, ghost, "x")).toThrow("Photo not found");
    expect(() => removePhoto(data, createUuidId<"PersonId">() as PersonId, ghost)).toThrow(
      "Person not found",
    );
  });

  it("goes away with the person", () => {
    const { data, id } = setup();
    expect(removePerson(data, id).people).toEqual([]);
  });

  it("leaves other people untouched", () => {
    const base = setup();
    const id = base.id;
    const data = addPerson(base.data, { firstName: "Byron", lastName: "" });
    const other = data.people[1]!;
    const next = makeMainPhoto(data, id, photosOf(data)[1]!.id);
    expect(next.people[1]).toBe(other);
  });
});

const setCaption = setPhotoCaption;
