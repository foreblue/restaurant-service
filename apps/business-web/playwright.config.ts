import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 45_000,
  expect: {
    timeout: 7_000,
  },
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4177",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 4177",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
