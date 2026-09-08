import { registerBindings } from "./platform/deno-desktop.ts";

const DIST_DIR = new URL("../dist/", import.meta.url);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const file = await Deno.readFile(new URL(`.${path}`, DIST_DIR));
    return new Response(file, {
      headers: { "content-type": contentType(path) },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

function contentType(path: string): string {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".html")) return "text/html";
  return "application/octet-stream";
}

// The first `new Deno.BrowserWindow()` adopts the window the runtime already
// opened at startup, pointed at the server above.
const win = new Deno.BrowserWindow({
  title: "Genealogigi",
});

registerBindings(win);

win.addEventListener("close", () => {
  Deno.exit(0);
});
