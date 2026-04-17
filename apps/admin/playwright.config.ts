import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Load apps/admin/.env.local so fixtures can sign JWE cookies with the
// same AUTH_SECRET as the Next.js dev server.
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// Default to headed locally (CLAUDE.md: "기본 `--headed` / CI는 `--headless`").
// CI sets `CI=1` which flips to headless + disables slowMo.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !isCI,
  workers: isCI ? 2 : 1,
  // HTML 리포트는 CI/로컬 모두 항상 생성 (Tester 규율: HTML 리포트 필수)
  // open: "never" — 스크립트 환경에서 hang 방지 (dev-workflow.md)
  reporter: isCI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: "http://localhost:3000",
    headless: isCI,
    launchOptions: {
      slowMo: isCI ? 0 : 80,
    },
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm --filter @admin-console/admin dev",
    cwd: "../..",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
