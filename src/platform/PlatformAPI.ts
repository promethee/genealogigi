export interface PersonRecord {
  id: string;
  // fields defined once the data model lands (Phase 2)
}

export interface FamilyData {
  people: unknown[]; // shape defined in Phase 2's "person record" feature
  relationships: unknown[]; // shape defined in Phase 2's "relationship" feature
}

export interface PlatformAPI {
  // Window lifecycle
  minimize(): void;
  close(): void;

  // File access
  openFileDialog(options?: { extensions?: string[] }): Promise<string | null>;
  saveFileDialog(options?: { defaultName?: string }): Promise<string | null>;

  // File-backed pass-through (JSON), kept here so Vue/Pinia never touch
  // the filesystem directly
  data: {
    load(): Promise<FamilyData>;
    save(data: FamilyData): Promise<void>;
  };

  // Exit
  exit(code?: number): void;
}
