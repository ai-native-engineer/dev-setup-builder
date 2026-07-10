import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/playwright",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173/dev-setup-builder/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" })
  },
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173/dev-setup-builder/",
    timeout: 120000
  }
});
