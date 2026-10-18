import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { addPerson, removePerson, updatePerson, type PersonFormInput } from "../data/people.ts";
import {
  addParentChild,
  addPartners,
  relationshipsOf,
  removeRelationship,
  updateRelationship,
  type ParentChildInput,
  type PartnersInput,
} from "../data/relationships.ts";
import type { FamilyData, PersonId, RelationshipId } from "../data/types.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";

const DEFAULT_FILE_NAME = "family.json";
const COPY_FILE_NAME = "family-copy.json";

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

function describe(err: unknown): string {
  if (err instanceof SyntaxError) return "The file is not valid JSON.";
  return err instanceof Error ? err.message : String(err);
}

/** Built from a PlatformAPI so the logic is testable without a shell. */
export function defineFamilyStore(platform: PlatformAPI) {
  return defineStore("family", () => {
    const filePath = ref<string | null>(null);
    const data = ref<FamilyData | null>(null);
    const error = ref<string | null>(null);
    /** Positive feedback (e.g. copy saved); cleared by the next action. */
    const notice = ref<string | null>(null);
    /** Remembered path whose file still exists, or null. */
    const resumePath = ref<string | null>(null);

    const resumeFileName = computed(() => (resumePath.value ? fileNameOf(resumePath.value) : null));

    async function enter(path: string, loaded: FamilyData): Promise<void> {
      await platform.settings.setLastFilePath(path);
      filePath.value = path;
      data.value = loaded;
      error.value = null;
      notice.value = null;
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
          error.value = `Last family file not found: ${remembered}`;
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
    function saveCopy(): Promise<boolean> {
      const run = async (): Promise<boolean> => {
        const openPath = filePath.value;
        if (!openPath || !data.value) return false;
        notice.value = null;
        try {
          const target = await platform.saveFileDialog({ defaultName: COPY_FILE_NAME });
          if (!target) return false;
          if (samePath(target, openPath)) {
            error.value = "Choose a different file: that one is the file currently open.";
            return false;
          }
          // Read after the dialog so the copy matches the file as it is now.
          if (!data.value) return false;
          await platform.data.save(target, data.value);
          error.value = null;
          notice.value = `Copy saved to ${target}`;
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

    const addPersonNamed = (input: PersonFormInput) =>
      mutate((current) => addPerson(current, input));

    const editPerson = (id: PersonId, input: PersonFormInput) =>
      mutate((current) => updatePerson(current, id, input));

    /** Asks for confirmation first; returns true only if the person was deleted. */
    async function deletePerson(id: PersonId, label: string): Promise<boolean> {
      const count = data.value ? relationshipsOf(data.value, id).length : 0;
      const also =
        count > 0 ? ` and ${count} ${count === 1 ? "relationship" : "relationships"}` : "";
      if (!(await platform.confirm(`Delete ${label}${also}? This cannot be undone.`))) return false;
      return mutate((current) => removePerson(current, id));
    }

    const addParentChildLink = (input: ParentChildInput) =>
      mutate((current) => addParentChild(current, input));

    const addPartnersLink = (input: PartnersInput) =>
      mutate((current) => addPartners(current, input));

    const editRelationship = (id: RelationshipId, input: ParentChildInput | PartnersInput) =>
      mutate((current) => updateRelationship(current, id, input));

    /** Asks for confirmation first; returns true only if the relationship was deleted. */
    async function deleteRelationship(id: RelationshipId, label: string): Promise<boolean> {
      if (!(await platform.confirm(`Delete "${label}"? This cannot be undone.`))) return false;
      return mutate((current) => removeRelationship(current, id));
    }

    return {
      filePath,
      data,
      error,
      notice,
      resumePath,
      resumeFileName,
      init,
      resume,
      openExisting,
      createNew,
      addPerson: addPersonNamed,
      editPerson,
      deletePerson,
      addParentChild: addParentChildLink,
      addPartners: addPartnersLink,
      editRelationship,
      deleteRelationship,
      saveCopy,
    };
  });
}
