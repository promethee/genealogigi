import { loadFamilyData, saveFamilyData } from '../data/store.ts';

export function registerBindings(win: Deno.BrowserWindow) {
  win.bind('minimize', () => {
    // TODO: no documented Deno.BrowserWindow minimize() yet — revisit against
    // the Windows API reference once this is actually needed.
  });

  win.bind('close', () => win.close());

  win.bind('openFileDialog', (_options?: { extensions?: string[] }) => {
    // TODO: native file dialog API — not covered in the desktop docs reviewed
    // so far; revisit under Dialogs in the Deno Desktop docs.
    return null;
  });

  win.bind('saveFileDialog', (_options?: { defaultName?: string }) => {
    // TODO: same as above.
    return null;
  });

  win.bind('dataLoad', loadFamilyData);
  win.bind('dataSave', saveFamilyData);

  win.bind('exit', (code?: number) => Deno.exit(code ?? 0));
}
