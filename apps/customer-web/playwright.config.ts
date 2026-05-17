import { defineConfig, devices } from "@playwright/test";

const appPort = 4178;
const apiPort = 4181;

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
    baseURL: `http://127.0.0.1:${appPort}`,
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
  webServer: [
    {
      command: `node e2e/mock-api.mjs --port ${apiPort}`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:${apiPort} NEXT_PUBLIC_APP_BASE_URL=http://127.0.0.1:${appPort} pnpm exec next dev -H 127.0.0.1 -p ${appPort}`,
      url: `http://127.0.0.1:${appPort}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
