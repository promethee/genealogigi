import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// One source of truth for the version: package.json (a test keeps tauri.conf.json and Cargo.toml equal).
const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [vue(), tailwindcss()],
  // Tauri expects a fixed dev port and must not clear the terminal.
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
  test: { include: ["src/**/*.test.ts"] },
});
