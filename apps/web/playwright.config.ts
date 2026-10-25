import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.E2E_PORT ?? 3101)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

/**
 * Runs against a production build: `pnpm --filter web build` first.
 * Set PLAYWRIGHT_BASE_URL to test a deployed site instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
