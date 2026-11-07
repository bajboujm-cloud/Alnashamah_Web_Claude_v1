import { defineConfig, devices } from "@playwright/test";

// Same port as `pnpm dev`, so a dev server you already have running is reused.
const PORT = 3000;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  // Tests flip stock toggles in the database, so run them one at a time.
  workers: 1,
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // CI tests the production build; locally the dev server is reused if already running.
    command: isCI ? `pnpm start --port ${PORT}` : `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}/ar`,
    reuseExistingServer: !isCI,
    // The production build hides login codes; the tests read them from the laptop-only test box.
    env: { OTP_SHOW_CODE: "true", OTP_IP_LIMIT_PER_HOUR: "1000" },
    timeout: 120_000,
  },
});
