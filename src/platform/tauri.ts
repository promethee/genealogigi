import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { exists, readFile, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { exit } from "@tauri-apps/plugin-process";
import { load as loadStore } from "@tauri-apps/plugin-store";
import {
  loadFamilyData,
  readRawFile,
  saveFamilyData,
  writeRawFile,
  type FileIO,
} from "../data/store.ts";
import { toGitSyncError, type GitSyncResult } from "./gitSync.ts";
import type { GitStatus, PickedImage, PlatformAPI } from "./PlatformAPI.ts";

import { askConfirm } from "../lib/confirmDialog.ts";

const FAMILY_FILE_FILTER_NAME = "Genealogigi family";
const OPEN_EXTENSIONS = ["gigi", "json"];
const SAVE_EXTENSIONS = ["gigi"];
const SETTINGS_FILE = "settings.json";
const LAST_FILE_PATH_KEY = "lastFilePath";
const LANGUAGE_KEY = "language";
const DISMISSED_UPDATE_KEY = "dismissedUpdate";
const THEME_KEY = "theme";
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** The file's bytes as a data URL (read through the browser so large files are not copied by hand). */
function toDataUrl(bytes: Uint8Array, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.readAsDataURL(new Blob([bytes as BlobPart], { type: mime }));
  });
}

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
          { name: FAMILY_FILE_FILTER_NAME, extensions: options?.extensions ?? OPEN_EXTENSIONS },
        ],
      });
      return selected ?? null;
    },
    saveFileDialog: (options) =>
      save({
        defaultPath: options?.defaultName,
        filters: [{ name: FAMILY_FILE_FILTER_NAME, extensions: SAVE_EXTENSIONS }],
      }),
    confirm: askConfirm,
    data: {
      exists: (filePath) => exists(filePath),
      load: (filePath) => loadFamilyData(tauriFileIO, filePath),
      save: (filePath, data) => saveFamilyData(tauriFileIO, filePath, data),
      readRaw: (filePath) => readRawFile(tauriFileIO, filePath),
      writeRaw: (filePath, text) => writeRawFile(tauriFileIO, filePath, text),
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
      getTheme: async () => {
        const store = await settingsStore();
        return (await store.get<string>(THEME_KEY)) ?? null;
      },
      setTheme: async (theme) => {
        const store = await settingsStore();
        await store.set(THEME_KEY, theme);
        await store.save();
      },
      getDismissedUpdate: async () => {
        const store = await settingsStore();
        return (await store.get<string>(DISMISSED_UPDATE_KEY)) ?? null;
      },
      setDismissedUpdate: async (version) => {
        const store = await settingsStore();
        await store.set(DISMISSED_UPDATE_KEY, version);
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
    window: { setTitle: (title) => getCurrentWindow().setTitle(title) },
    pickImages: async (): Promise<PickedImage[]> => {
      const selected = await open({
        multiple: true,
        directory: false,
        filters: [{ name: "Images", extensions: IMAGE_EXTENSIONS }],
      });
      const paths = selected === null ? [] : Array.isArray(selected) ? selected : [selected];
      const images: PickedImage[] = [];
      for (const path of paths) {
        const name = path.split(/[/\\]/).pop() ?? path;
        const extension = name.split(".").pop()?.toLowerCase() ?? "";
        images.push({
          name,
          dataUrl: await toDataUrl(
            await readFile(path),
            MIME[extension] ?? "application/octet-stream",
          ),
        });
      }
      return images;
    },
    openExternal: (url) => openUrl(url),
    exit: (code) => exit(code ?? 0),
  };
}
