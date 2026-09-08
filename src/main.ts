import { BrowserWindow } from "@deno/desktop";
import { createPlatformAPI } from "./platform/deno-desktop.ts";

const platform = createPlatformAPI();

const win = new BrowserWindow({
  title: "Genealogigi",
  frameless: true,
  width: 1200,
  height: 800,
  url: import.meta.resolve("../dist/index.html"),
});

// Expose PlatformAPI to the renderer via IPC bridge (Deno Desktop specific).
win.exposeFunction("platformAPI", platform);

win.on("close", () => {
  Deno.exit(0);
});