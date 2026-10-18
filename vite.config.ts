import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Tauri expects a fixed dev port and must not clear the terminal.
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
  test: { include: ["src/**/*.test.ts"] },
});
