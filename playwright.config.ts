import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  // On CI one retry absorbs a one-off page-load stall of the Windows runner (seen twice: the welcome
  // screen never appeared); the failed attempt keeps its trace, uploaded as an artifact, so a real
  // regression still fails twice and a repeating stall leaves evidence.
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    // Optional: reuse an already-installed Chromium instead of `playwright install`.
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
