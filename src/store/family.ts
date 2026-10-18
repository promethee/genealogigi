import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { addEvent, removeEvent, updateEvent, type EventInput } from "../data/events.ts";
import {
  addPhotos,
  makeMainPhoto,
  removePhoto,
  setPhotoCaption,
  type PhotoInput,
} from "../data/photos.ts";
import { backupPath, fileNameOf as baseName, hashText } from "../data/backup.ts";
import {
  ImportError,
  parseFamilyFile,
  summarize,
  type FamilySummary,
  type ImportWarning,
} from "../data/importFamily.ts";
import { renderShareHtml } from "../data/shareHtml.ts";
import { buildShareModel } from "../data/shareModel.ts";
import { locale } from "../i18n/index.ts";
import { shrinkToJpeg } from "../lib/image.ts";
import { t, tn } from "../i18n/index.ts";
import { addPersonWithParents, type NewPersonParents } from "../data/createPerson.ts";
import { removePerson, updatePerson, type PersonFormInput } from "../data/people.ts";
import {
  addParentChild,
  addParentsOfChild,
  addPartners,
  relationshipsOf,
  removeRelationship,
  updateRelationship,
  type ParentChildInput,
  type ParentsOfChildInput,
  type PartnersInput,
} from "../data/relationships.ts";
import type { EventId, FamilyData, PersonId, PhotoId, RelationshipId } from "../data/types.ts";
import type { GitStatus, PlatformAPI } from "../platform/PlatformAPI.ts";

const DEFAULT_FILE_NAME = "family.gigi";
const EXPORT_FILE_NAME = "family-export.gigi";

function emptyFamily(): FamilyData {
  return { schemaVersion: 1, people: [], relationships: [] };
}

function fileNameOf(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

/** Windows paths are case-insensitive and may mix slash styles. */
function samePath(a: string, b: string): boolean {
  const normalise = (path: string) => path.replaceAll("\\", "/").toLowerCase();
  return normalise(a) === normalise(b);
}

function summaryText(s: FamilySummary): string {
  return [
    tn("summary.people", s.people),
    tn("summary.relationships", s.relationships),
    tn("summary.events", s.events),
    tn("summary.photos", s.photos),
  ].join(" · ");
}

function warningText(w: ImportWarning): string {
  return w.code === "no-version"
    ? t("import.warn.no-version")
    : t(`import.warn.${w.code}`, { count: w.count });
}

function describe(err: unknown): string {
  if (err instanceof SyntaxError) return t("store.invalidJson");
  return err instanceof Error ? err.message : String(err);
}

/** Built from a PlatformAPI so the logic is testable without a shell. */
export function defineFamilyStore(
  platform: PlatformAPI,
  /** Shrinks a picked image to the size stored in the file; replaceable in tests (no canvas in Node). */
  shrink: (dataUrl: string) => Promise<string> = shrinkToJpeg,
) {
  return defineStore("family", () => {
    const filePath = ref<string | null>(null);
    const data = ref<FamilyData | null>(null);
    const error = ref<string | null>(null);
    /** Positive feedback (e.g. copy saved); cleared by the next action. */
    const notice = ref<string | null>(null);
    /** Items skipped by the last import; cleared with the notice. */
    const warnings = ref<string[]>([]);
    /** Remembered path whose file still exists, or null. */
    const resumePath = ref<string | null>(null);

    /** "unavailable" when the shell cannot tell (the git section is then hidden). */
    const gitStatus = ref<GitStatus | "unavailable">("unavailable");
    const syncing = ref(false);

    const resumeFileName = computed(() => (resumePath.value ? fileNameOf(resumePath.value) : null));

    async function refreshGitStatus(): Promise<void> {
      const path = filePath.value;
      if (!path) return;
      try {
        gitStatus.value = await platform.git.status(path);
      } catch {
        gitStatus.value = "unavailable";
      }
    }

    async function enter(path: string, loaded: FamilyData): Promise<void> {
      await platform.settings.setLastFilePath(path);
      filePath.value = path;
      data.value = loaded;
      error.value = null;
      notice.value = null;
      warnings.value = [];
      gitStatus.value = "unavailable";
      await refreshGitStatus();
    }

    /** Failures stay on the welcome screen with a readable message. */
    async function attempt(action: () => Promise<void>): Promise<void> {
      try {
        await action();
      } catch (err) {
        error.value = describe(err);
      }
    }

    async function init(): Promise<void> {
      resumePath.value = null;
      error.value = null;
      await attempt(async () => {
        const remembered = await platform.settings.getLastFilePath();
        if (!remembered) return;
        if (await platform.data.exists(remembered)) {
          resumePath.value = remembered;
        } else {
          error.value = t("store.lastNotFound", { path: remembered });
        }
      });
    }

    async function resume(): Promise<void> {
      const path = resumePath.value;
      if (!path) return;
      await attempt(async () => enter(path, await platform.data.load(path)));
    }

    async function openExisting(): Promise<void> {
      await attempt(async () => {
        const path = await platform.openFileDialog();
        if (!path) return;
        await enter(path, await platform.data.load(path));
      });
    }

    async function createNew(): Promise<void> {
      await attempt(async () => {
        const path = await platform.saveFileDialog({ defaultName: DEFAULT_FILE_NAME });
        if (!path) return;
        const empty = emptyFamily();
        await platform.data.save(path, empty);
        await enter(path, empty);
      });
    }

    /** Saves run one at a time so quick successive edits cannot overwrite each other. */
    let pendingMutation: Promise<unknown> = Promise.resolve();

    /**
     * Applies `change`, saves the result, and only then updates the in-memory
     * data, so a failed save leaves the app exactly as it was.
     */
    function mutate(change: (current: FamilyData) => FamilyData): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const path = filePath.value;
        const current = data.value;
        if (!path || !current) return false;
        notice.value = null;
        warnings.value = [];
        try {
          const next = change(current);
          await platform.data.save(path, next);
          data.value = next;
          error.value = null;
          return true;
        } catch (err) {
          error.value = describe(err);
          return false;
        }
      };
      const result = pendingMutation.then(run);
      pendingMutation = result;
      return result;
    }

    /** Writes a snapshot elsewhere; the open file stays the open file. */
    function exportFamily(): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const openPath = filePath.value;
        if (!openPath || !data.value) return false;
        notice.value = null;
        warnings.value = [];
        try {
          const target = await platform.saveFileDialog({ defaultName: EXPORT_FILE_NAME });
          if (!target) return false;
          if (samePath(target, openPath)) {
            error.value = t("store.chooseDifferent");
            return false;
          }
          // Read after the dialog so the copy matches the file as it is now.
          if (!data.value) return false;
          await platform.data.save(target, data.value);
          error.value = null;
          notice.value = t("export.done", {
            path: target,
            summary: summaryText(summarize(data.value)),
          });
          return true;
        } catch (err) {
          error.value = describe(err);
          return false;
        }
      };
      const result = pendingMutation.then(run);
      pendingMutation = result;
      return result;
    }

    /**
     * Replaces the open family by the content of a chosen file, after a confirmation and a
     * verified backup of the current file. Any failure leaves the current data untouched.
     */
    function importFamily(): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const openPath = filePath.value;
        if (!openPath || !data.value) return false;
        notice.value = null;
        warnings.value = [];
        try {
          const source = await platform.openFileDialog();
          if (!source) return false;
          if (samePath(source, openPath)) {
            error.value = t("import.error.sameFile");
            return false;
          }
          let text: string;
          try {
            text = await platform.data.readRaw(source);
          } catch (err) {
            error.value = t("import.error.read", { detail: describe(err) });
            return false;
          }
          const parsed = parseFamilyFile(text, {
            "not-json": t("import.error.not-json"),
            "not-family": t("import.error.not-family"),
            "newer-version": t("import.error.newer-version"),
          });
          const current = data.value;
          let previous: string;
          try {
            previous = await platform.data.readRaw(openPath);
          } catch {
            previous = JSON.stringify(current, null, 2);
          }
          const hash = await hashText(previous);
          const identical = JSON.stringify(parsed.data) === JSON.stringify(current);
          if (identical && parsed.warnings.length === 0) {
            error.value = null;
            notice.value = t("import.identical");
            return false;
          }
          const backup = backupPath(openPath, new Date(), hash);
          const list = parsed.warnings.map((w) => `• ${warningText(w)}`);
          const extra =
            (parsed.summary.people === 0 ? t("import.confirm.empty") : "") +
            (list.length ? t("import.confirm.warnings", { list: list.join("\n") }) : "");
          const confirmed = await platform.confirm(
            t("import.confirm", {
              file: baseName(source),
              incoming: summaryText(parsed.summary),
              current: summaryText(summarize(current)),
              backup: baseName(backup),
              extra,
            }),
          );
          if (!confirmed) return false;
          try {
            await platform.data.writeRaw(backup, previous);
          } catch (err) {
            error.value = t("import.error.backup", { detail: describe(err) });
            return false;
          }
          let written: string | null = null;
          try {
            written = await platform.data.readRaw(backup);
          } catch {
            written = null;
          }
          if (written !== previous || (await hashText(written)) !== hash) {
            error.value = t("import.error.backupVerify");
            return false;
          }
          await platform.data.save(openPath, parsed.data);
          data.value = parsed.data;
          error.value = null;
          warnings.value = list;
          notice.value = t("import.done", {
            file: baseName(source),
            incoming: summaryText(parsed.summary),
            backup: baseName(backup),
          });
          return true;
        } catch (err) {
          error.value = err instanceof ImportError ? err.message : describe(err);
          return false;
        }
      };
      const result = pendingMutation.then(run);
      pendingMutation = result;
      return result;
    }

    /**
     * Writes the whole family as one self-contained web page after a warning that everyone,
     * notes and photos included, will be readable by whoever gets the file.
     */
    function shareWebPage(): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const openPath = filePath.value;
        if (!openPath || !data.value) return false;
        notice.value = null;
        warnings.value = [];
        try {
          const base = baseName(openPath).replace(/\.[^.]+$/, "");
          if (!(await platform.confirm(t("share.confirm", { file: baseName(openPath) })))) {
            return false;
          }
          const target = await platform.saveFileDialog({
            defaultName: t("share.defaultName"),
            extensions: ["html"],
          });
          if (!target) return false;
          if (!data.value) return false;
          const html = renderShareHtml(
            buildShareModel(data.value, { title: base, lang: locale.value, today: new Date() }),
          );
          await platform.data.writeRaw(target, html);
          error.value = null;
          notice.value = t("share.done", { path: target });
          return true;
        } catch (err) {
          error.value = describe(err);
          return false;
        }
      };
      const result = pendingMutation.then(run);
      pendingMutation = result;
      return result;
    }

    /** Leaves the family (after pending saves finish) and goes back to the welcome screen. */
    async function closeFamily(): Promise<void> {
      await pendingMutation;
      filePath.value = null;
      data.value = null;
      error.value = null;
      notice.value = null;
      warnings.value = [];
      gitStatus.value = "unavailable";
      syncing.value = false;
      await init();
    }

    /** Commits, pulls and pushes through git, then reloads the file it may have changed. */
    function syncGit(): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const path = filePath.value;
        if (!path || gitStatus.value !== "ready") return false;
        notice.value = null;
        warnings.value = [];
        syncing.value = true;
        try {
          const result = await platform.git.sync(path);
          data.value = await platform.data.load(path);
          error.value = null;
          notice.value = t(`git.result.${result}`);
          return true;
        } catch (err) {
          error.value = describe(err);
          return false;
        } finally {
          syncing.value = false;
          await refreshGitStatus();
        }
      };
      const result = pendingMutation.then(run);
      pendingMutation = result;
      return result;
    }

    const addPersonNamed = (input: PersonFormInput, parents?: NewPersonParents) =>
      mutate((current) => addPersonWithParents(current, input, parents));

    const editPerson = (id: PersonId, input: PersonFormInput) =>
      mutate((current) => updatePerson(current, id, input));

    /** Asks for confirmation first; returns true only if the person was deleted. */
    async function deletePerson(id: PersonId, label: string): Promise<boolean> {
      const count = data.value ? relationshipsOf(data.value, id).length : 0;
      const also = count > 0 ? tn("store.alsoRelationships", count) : "";
      if (!(await platform.confirm(t("store.confirmDeletePerson", { label, also })))) return false;
      return mutate((current) => removePerson(current, id));
    }

    const addParentChildLink = (input: ParentChildInput) =>
      mutate((current) => addParentChild(current, input));

    const addParents = (input: ParentsOfChildInput) =>
      mutate((current) => addParentsOfChild(current, input));

    const addEventLink = (input: EventInput) => mutate((current) => addEvent(current, input));

    const editEvent = (id: EventId, input: EventInput) =>
      mutate((current) => updateEvent(current, id, input));

    /** Asks for confirmation first; returns true only if the event was deleted. */
    async function deleteEvent(id: EventId): Promise<boolean> {
      if (!(await platform.confirm(t("event.confirmDelete")))) return false;
      return mutate((current) => removeEvent(current, id));
    }

    /**
     * Lets the user pick images, shrinks them and adds the valid ones to the person's photos in
     * one save. A file that is not a usable image is skipped and reported.
     */
    async function pickPhotos(personId: PersonId): Promise<boolean> {
      let picked: Awaited<ReturnType<PlatformAPI["pickImages"]>>;
      try {
        picked = await platform.pickImages();
      } catch (err) {
        error.value = describe(err);
        return false;
      }
      if (picked.length === 0) return false;
      const photos: PhotoInput[] = [];
      let skipped = 0;
      for (const image of picked) {
        try {
          photos.push({ dataUrl: await shrink(image.dataUrl) });
        } catch {
          skipped += 1;
        }
      }
      let ok = true;
      if (photos.length > 0) ok = await mutate((current) => addPhotos(current, personId, photos));
      if (ok && skipped > 0) error.value = t("err.photoInvalid");
      return ok && photos.length > 0;
    }

    const makeMain = (personId: PersonId, photoId: PhotoId) =>
      mutate((current) => makeMainPhoto(current, personId, photoId));

    const captionPhoto = (personId: PersonId, photoId: PhotoId, caption: string) =>
      mutate((current) => setPhotoCaption(current, personId, photoId, caption));

    /** Asks for confirmation first; returns true only if the photo was removed. */
    async function deletePhoto(personId: PersonId, photoId: PhotoId): Promise<boolean> {
      if (!(await platform.confirm(t("photo.confirmRemove")))) return false;
      return mutate((current) => removePhoto(current, personId, photoId));
    }

    const addPartnersLink = (input: PartnersInput) =>
      mutate((current) => addPartners(current, input));

    const editRelationship = (id: RelationshipId, input: ParentChildInput | PartnersInput) =>
      mutate((current) => updateRelationship(current, id, input));

    /** Asks for confirmation first; returns true only if the relationship was deleted. */
    async function deleteRelationship(id: RelationshipId, label: string): Promise<boolean> {
      if (!(await platform.confirm(t("store.confirmDeleteRel", { label })))) return false;
      return mutate((current) => removeRelationship(current, id));
    }

    return {
      filePath,
      data,
      error,
      notice,
      warnings,
      resumePath,
      resumeFileName,
      gitStatus,
      syncing,
      refreshGitStatus,
      syncGit,
      init,
      resume,
      openExisting,
      createNew,
      addPerson: addPersonNamed,
      editPerson,
      deletePerson,
      addParentChild: addParentChildLink,
      addParents,
      addPartners: addPartnersLink,
      addEvent: addEventLink,
      pickPhotos,
      makeMainPhoto: makeMain,
      captionPhoto,
      deletePhoto,
      editEvent,
      deleteEvent,
      editRelationship,
      deleteRelationship,
      exportFamily,
      shareWebPage,
      importFamily,
      closeFamily,
    };
  });
}
