import type { FamilyData } from "../data/types.ts";

export interface PlatformAPI {
  minimize(): void;
  close(): void;
  openFileDialog(options?: { extensions?: string[] }): Promise<string | null>;
  saveFileDialog(options?: { defaultName?: string }): Promise<string | null>;
  data: {
    load(): Promise<FamilyData>;
    save(data: FamilyData): Promise<void>;
  };
  exit(code?: number): void;
}

// `bindings` is injected into the webview's global scope by `deno desktop`
// (see src/platform/deno-desktop.ts for the Deno-side registrations).
declare global {
  const bindings: {
    minimize(): Promise<void>;
    close(): Promise<void>;
    openFileDialog(options?: { extensions?: string[] }): Promise<string | null>;
    saveFileDialog(options?: { defaultName?: string }): Promise<string | null>;
    dataLoad(): Promise<FamilyData>;
    dataSave(data: FamilyData): Promise<void>;
    exit(code?: number): Promise<void>;
  };
}

export function createPlatformAPI(): PlatformAPI {
  return {
    minimize: () => {
      bindings.minimize();
    },
    close: () => {
      bindings.close();
    },
    openFileDialog: (options) => bindings.openFileDialog(options),
    saveFileDialog: (options) => bindings.saveFileDialog(options),
    data: {
      load: () => bindings.dataLoad(),
      save: (data) => bindings.dataSave(data),
    },
    exit: (code) => {
      bindings.exit(code);
    },
  };
}
