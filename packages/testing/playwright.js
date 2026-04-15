// @admin-console/testing/playwright — 공용 Playwright 설정 팩토리.
// Phase 1/9 소비처에서 baseURL / projects 커스터마이즈.
import { defineConfig } from "@playwright/test";

export function createPlaywrightConfig(overrides = {}) {
  return defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [["github"], ["html"]] : "list",
    use: {
      trace: "on-first-retry",
      ...overrides.use,
    },
    ...overrides,
  });
}
