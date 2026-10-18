import type { FamilyData } from "../data/types.ts";

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
  exit(code?: number): Promise<void>;
}
