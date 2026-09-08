import type { PlatformAPI } from './PlatformAPI.ts';
import { loadFamilyData, saveFamilyData } from '../data/store.ts';

export function createPlatformAPI(): PlatformAPI {
  return {
    minimize() {
      // TODO: wire to Deno.BrowserWindow instance once window ref is threaded in
    },
    close() {
      // TODO: wire to Deno.BrowserWindow instance
    },
    async openFileDialog(_options) {
      // TODO: Deno Desktop native file dialog API
      return null;
    },
    async saveFileDialog(_options) {
      // TODO: Deno Desktop native file dialog API
      return null;
    },
    data: {
      load: loadFamilyData,
      save: saveFamilyData,
    },
    exit(code = 0) {
      Deno.exit(code);
    },
  };
}
