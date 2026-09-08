import { loadFamilyData, saveFamilyData } from "../data/store.ts";

export function registerBindings(win: Deno.BrowserWindow) {
  // All event handlers must return a Promise per Deno Desktop API.
  win.bind("minimize", async () => {
    // Placeholder – no operation needed currently.
    // TODO: integrate with OS minimize when required.
  });

  win.bind("close", async () => {
    // Close the window; win.close() is synchronous, but we wrap in async.
    win.close();
    await Promise.resolve();
  });

  win.bind("openFileDialog", async (_options?: { extensions?: string[] }) => {
    // TODO: implement native file dialog.
    await Promise.resolve();
    return null;
  });

  win.bind("saveFileDialog", async (_options?: { defaultName?: string }) => {
    // TODO: implement save-file dialog.
    await Promise.resolve();
    return null;
  });

  win.bind("dataLoad", loadFamilyData);
  win.bind("dataSave", saveFamilyData);

  win.bind("exit", (code?: number) => Deno.exit(code ?? 0));
}
