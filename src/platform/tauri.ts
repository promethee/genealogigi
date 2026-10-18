import { invoke } from "@tauri-apps/api/core";
import { confirm, open, save } from "@tauri-apps/plugin-dialog";
import { exists, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { exit } from "@tauri-apps/plugin-process";
import { load as loadStore } from "@tauri-apps/plugin-store";
import { loadFamilyData, saveFamilyData, type FileIO } from "../data/store.ts";
import { toGitSyncError, type GitSyncResult } from "./gitSync.ts";
import type { GitStatus, PlatformAPI } from "./PlatformAPI.ts";

const FAMILY_FILE_FILTER_NAME = "Genealogigi family";
const DEFAULT_EXTENSIONS = ["json"];
const SETTINGS_FILE = "settings.json";
const LAST_FILE_PATH_KEY = "lastFilePath";
const LANGUAGE_KEY = "language";

// Opened lazily so merely importing this module never touches Tauri.
const settingsStore = () => loadStore(SETTINGS_FILE, { defaults: {}, autoSave: false });

const tauriFileIO: FileIO = {
  exists: (path) => exists(path),
  readText: (path) => readTextFile(path),
  writeText: (path, content) => writeTextFile(path, content),
  rename: (from, to) => rename(from, to),
};

export function createPlatformAPI(): PlatformAPI {
  return {
    openFileDialog: async (options) => {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          { name: FAMILY_FILE_FILTER_NAME, extensions: options?.extensions ?? DEFAULT_EXTENSIONS },
        ],
      });
      return selected ?? null;
    },
    saveFileDialog: (options) =>
      save({
        defaultPath: options?.defaultName,
        filters: [{ name: FAMILY_FILE_FILTER_NAME, extensions: DEFAULT_EXTENSIONS }],
      }),
    confirm: (message) => confirm(message, { title: "Genealogigi", kind: "warning" }),
    data: {
      exists: (filePath) => exists(filePath),
      load: (filePath) => loadFamilyData(tauriFileIO, filePath),
      save: (filePath, data) => saveFamilyData(tauriFileIO, filePath, data),
    },
    settings: {
      getLastFilePath: async () => {
        const store = await settingsStore();
        return (await store.get<string>(LAST_FILE_PATH_KEY)) ?? null;
      },
      setLastFilePath: async (filePath) => {
        const store = await settingsStore();
        if (filePath === null) await store.delete(LAST_FILE_PATH_KEY);
        else await store.set(LAST_FILE_PATH_KEY, filePath);
        await store.save();
      },
      getLanguage: async () => {
        const store = await settingsStore();
        return (await store.get<string>(LANGUAGE_KEY)) ?? null;
      },
      setLanguage: async (language) => {
        const store = await settingsStore();
        await store.set(LANGUAGE_KEY, language);
        await store.save();
      },
    },
    git: {
      status: (filePath) => invoke<GitStatus>("git_status", { filePath }),
      // Rust rejects with { code, detail }; keep it a typed, translated error.
      sync: async (filePath) => {
        try {
          return await invoke<GitSyncResult>("git_sync", { filePath });
        } catch (err) {
          throw toGitSyncError(err);
        }
      },
    },
    exit: (code) => exit(code ?? 0),
  };
}
