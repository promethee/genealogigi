import type { FamilyData } from "../data/types.ts";

/** Whether the folder of a family file can be synced through git, and if not why. */
export type GitStatus = "no-git" | "not-repo" | "no-remote" | "ready";

/**
 * The only door to shell-specific capabilities. Vue components and Pinia
 * stores must go through this; never import shell packages (@tauri-apps/*)
 * anywhere else. Window chrome (close/minimize) is native, so not exposed.
 */
export interface PlatformAPI {
  openFileDialog(options?: { extensions?: string[] }): Promise<string | null>;
  saveFileDialog(options?: { defaultName?: string }): Promise<string | null>;
  confirm(message: string): Promise<boolean>;
  data: {
    exists(filePath: string): Promise<boolean>;
    load(filePath: string): Promise<FamilyData>;
    save(filePath: string, data: FamilyData): Promise<void>;
  };
  settings: {
    getLastFilePath(): Promise<string | null>;
    setLastFilePath(filePath: string | null): Promise<void>;
  };
  git: {
    status(filePath: string): Promise<GitStatus>;
    /** Commits the file, pulls (rebase) and pushes; resolves to a message, rejects with a reason. */
    sync(filePath: string): Promise<string>;
  };
  exit(code?: number): Promise<void>;
}
