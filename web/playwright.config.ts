import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const root = path.join(__dirname, "..");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev -w @mac-coding-agent/agent",
      url: "http://127.0.0.1:8787/api/health",
      reuseExistingServer: !process.env.CI,
      cwd: root,
      timeout: 120_000,
      env: {
        ...process.env,
        MCA_MODEL_PROVIDER: "stub",
        MCA_PORT: "8787",
      },
    },
    {
      command: "npm run dev -w @mac-coding-agent/web",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      cwd: root,
      timeout: 120_000,
    },
  ],
});
