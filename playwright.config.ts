import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    // Optional: reuse an already-installed Chromium instead of `playwright install`.
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
