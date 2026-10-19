import type { FamilyData } from "../data/types.ts";
import type { GitSyncResult } from "./gitSync.ts";

/** An image the user picked, as the file's own bytes in a data URL. */
export interface PickedImage {
  name: string;
  dataUrl: string;
}

/** Whether the folder of a family file can be synced through git, and if not why. */
export type GitStatus = "no-git" | "not-repo" | "no-remote" | "ready";

/**
 * The only door to shell-specific capabilities. Vue components and Pinia
 * stores must go through this; never import shell packages (@tauri-apps/*)
 * anywhere else. Window chrome (close/minimize) is native, so not exposed.
 */
export interface PlatformAPI {
  openFileDialog(options?: { extensions?: string[] }): Promise<string | null>;
  saveFileDialog(options?: { defaultName?: string; extensions?: string[] }): Promise<string | null>;
  confirm(message: string): Promise<boolean>;
  /**
   * Asks for a line of text (null = cancelled). Optional: a shell without it simply does not ask,
   * and the app behaves as it did before the question existed.
   */
  promptText?(options: {
    message: string;
    initial?: string;
    placeholder?: string;
  }): Promise<string | null>;
  data: {
    exists(filePath: string): Promise<boolean>;
    load(filePath: string): Promise<FamilyData>;
    save(filePath: string, data: FamilyData): Promise<void>;
    /** The exact text of a file (backups and imports work on text, not on parsed data). */
    readRaw(filePath: string): Promise<string>;
    /** Writes text exactly as given, atomically (a half-written file is never left behind). */
    writeRaw(filePath: string, text: string): Promise<void>;
  };
  settings: {
    getLastFilePath(): Promise<string | null>;
    setLastFilePath(filePath: string | null): Promise<void>;
    /** The saved UI language ("en" / "fr"), or null when never chosen. */
    getLanguage(): Promise<string | null>;
    setLanguage(language: string): Promise<void>;
    /** The saved theme ("light" / "dark"), or null when the user never chose. */
    getTheme(): Promise<string | null>;
    setTheme(theme: string): Promise<void>;
    /** The newest version whose update banner the user dismissed, or null. */
    getDismissedUpdate(): Promise<string | null>;
    setDismissedUpdate(version: string): Promise<void>;
  };
  git: {
    status(filePath: string): Promise<GitStatus>;
    /** Commits the file, pulls (rebase) and pushes. Rejects with a `GitSyncError`. */
    sync(filePath: string): Promise<GitSyncResult>;
  };
  window: {
    /** The native window title (the app name and version). */
    setTitle(title: string): Promise<void>;
  };
  /** Lets the user pick image files; resolves to their contents as data URLs (none if cancelled). */
  pickImages(): Promise<PickedImage[]>;
  /** Opens a link in the system browser. */
  openExternal(url: string): Promise<void>;
  exit(code?: number): Promise<void>;
}
