// @admin-console/testing/vitest — 공용 Vitest 설정 팩토리.
// Phase 1/2 소비처에서 overrides로 커스터마이즈.
import { defineConfig } from "vitest/config";

export function createVitestConfig(overrides = {}) {
  return defineConfig({
    test: {
      passWithNoTests: true,
      globals: false,
      environment: "node",
      include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
      },
      ...overrides.test,
    },
    ...overrides,
  });
}
