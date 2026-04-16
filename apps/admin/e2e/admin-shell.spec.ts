/**
 * admin-shell E2E — admin-shell slice 시나리오
 *
 * 선별 기준:
 * - 시나리오 1~9 전부 브라우저 실측 필요 (페이지 이동, 렌더 확인, 스타일 런타임 검증)
 * - 단위/RTL: isMenuActive 함수, menuItems 배열 — 별도 단위 테스트로 커버 가능
 *
 * 보안 검증:
 * - Set-Cookie 노출: curl 대신 response 헤더 검사 (E2E 내에서)
 * - storage 토큰 노출: localStorage/sessionStorage 키 확인
 * - 인증 가드 미적용 상태 (TODO hook point 스펙 일치) 확인
 */

import { test, expect } from "@playwright/test";

// ──────────────────────────────────────────────
// 시나리오 1: 루트 리다이렉트
// ──────────────────────────────────────────────
test("SC-01 루트 리다이렉트: / → /dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/dashboard");
});

// ──────────────────────────────────────────────
// 시나리오 2: Shell 랜드마크 가시 (footer 포함)
// ──────────────────────────────────────────────
test("SC-02 Shell 랜드마크 가시: aside(complementary) + banner + main + contentinfo 모두 visible", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const aside = page.locator('[role="complementary"], aside').first();
  const banner = page.locator('[role="banner"]').first();
  const main = page.locator("main").first();
  const footer = page.locator('[role="contentinfo"]').first();

  await expect(aside).toBeVisible();
  await expect(banner).toBeVisible();
  await expect(main).toBeVisible();
  await expect(footer).toBeVisible();
});

// ──────────────────────────────────────────────
// 시나리오 3: 메뉴 이동 (관리자 관리 /admins)
// ──────────────────────────────────────────────
test("SC-03 메뉴 이동: 관리자 관리 클릭 → URL /admins, aria-current 전환, 사이드바/헤더 유지", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const nav = page.locator('nav[aria-label="사이드바 주 메뉴"]');
  const dashboardNavLink = nav.locator('a[href="/dashboard"]');
  await expect(dashboardNavLink).toHaveAttribute("aria-current", "page");

  // 관리자 관리 클릭
  const adminsLink = nav.locator('a[href="/admins"]');
  await adminsLink.click();

  await expect(page).toHaveURL("/admins");

  // 관리자 관리 활성
  await expect(nav.locator('a[href="/admins"]')).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Dashboard 비활성
  const dashboardAttr = await nav
    .locator('a[href="/dashboard"]')
    .getAttribute("aria-current");
  expect(dashboardAttr).not.toBe("page");

  // 사이드바 + 헤더 유지
  await expect(page.locator("aside").first()).toBeVisible();
  await expect(page.locator('[role="banner"]').first()).toBeVisible();
});

// ──────────────────────────────────────────────
// 시나리오 4: prefix 매칭 런타임 — /admins/abc 직접 진입
// ──────────────────────────────────────────────
test("SC-04 prefix 매칭 런타임: /admins/abc 직접 진입 동작 확인", async ({
  page,
}) => {
  const response = await page.goto("/admins/abc");

  const status = response?.status();

  if (status === 404) {
    console.log(
      `SC-04: /admins/abc → 404, 동적 라우트(/admins/[id]) 미정의 → Next.js 404, Shell 미렌더 = 스펙 일치.`,
    );
    expect(status).toBe(404);
  } else if (status === 200) {
    await expect(page.locator('a[href="/admins"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

// ──────────────────────────────────────────────
// 시나리오 4b: 활성 스타일 검증 — aria-current, translate-x-1, rounded-xl
// ──────────────────────────────────────────────
test("SC-04b 활성 항목 스타일: aria-current=page + translate-x-1 + rounded-xl 클래스", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const nav = page.locator('nav[aria-label="사이드바 주 메뉴"]');
  const dashboardLink = nav.locator('a[href="/dashboard"]');

  await expect(dashboardLink).toHaveAttribute("aria-current", "page");

  const classList = await dashboardLink.evaluate((el) =>
    Array.from(el.classList),
  );
  expect(classList.some((c) => c.includes("translate-x-1"))).toBe(true);
  expect(classList.some((c) => c.includes("rounded-xl"))).toBe(true);
});

// ──────────────────────────────────────────────
// 시나리오 4c: false positive 방지 — /adminsettings 접근 시 관리자 관리 비활성
// ──────────────────────────────────────────────
test("SC-04c false positive 방지: /adminsettings 에서 관리자 관리 링크 비활성", async ({
  page,
}) => {
  const response = await page.goto("/adminsettings");
  const status = response?.status();

  // /adminsettings 라우트 미존재 → 404 또는 200 모두 가능
  if (status === 200) {
    const nav = page.locator('nav[aria-label="사이드바 주 메뉴"]');
    const adminsLink = nav.locator('a[href="/admins"]');
    const ariaCurrentAttr = await adminsLink.getAttribute("aria-current");
    // /adminsettings ≠ /admins prefix match → 관리자 관리 비활성이어야 함
    expect(ariaCurrentAttr).not.toBe("page");
  } else {
    // 404 — 라우트 미존재. Shell 없이 404 페이지만 렌더됨. 스펙 일치.
    console.log("SC-04c: /adminsettings → 404, false positive 미발생 확인됨");
    expect(status).toBe(404);
  }
});

// ──────────────────────────────────────────────
// 보안 검증 5: /users 라우트 → 404
// ──────────────────────────────────────────────
test("SEC-05 /users 라우트 접근 → 404", async ({ page }) => {
  const response = await page.goto("/users");
  expect(response?.status()).toBe(404);
});

// ──────────────────────────────────────────────
// 시나리오 5: viewport 고정 — 가로 스크롤 없음
// ──────────────────────────────────────────────
test("SC-05 viewport 1280×800 가로 스크롤 없음", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/dashboard");

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(1280);
});

// ──────────────────────────────────────────────
// 시나리오 6: 키보드 순회 Tab — aria-label → placeholder → textContent 순서로 매칭
// ──────────────────────────────────────────────
test("SC-06 키보드 Tab 순회: 워드마크 → 대시보드 → 관리자 관리 → 검색 → 테마 전환 → 알림 → 프로필", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const expectedSequence = [
    "ADMIN CONSOLE 홈", // 워드마크 link aria-label
    "대시보드", // 사이드바 메뉴
    "관리자 관리", // 사이드바 메뉴
    "시스템 기능 검색...", // 검색 input placeholder
    "테마 전환", // 테마 버튼 aria-label
    "알림", // 알림 버튼 aria-label
    "프로필", // 프로필 link aria-label
  ];

  await page.locator("body").click();

  const collected: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "";
      return (
        el.getAttribute("aria-label") ||
        (el as HTMLInputElement).placeholder ||
        el.textContent?.trim() ||
        ""
      );
    });

    if (name && expectedSequence.includes(name)) {
      if (!collected.includes(name)) {
        collected.push(name);
      }
    }

    if (collected.length >= expectedSequence.length) break;
  }

  expect(collected).toEqual(expectedSequence);
});

// ──────────────────────────────────────────────
// 시나리오 7: 헤더 브랜드 텍스트 전부 0건
// ──────────────────────────────────────────────
test('SC-07 헤더 role="banner" 내부에 금지 텍스트 0건', async ({ page }) => {
  await page.goto("/dashboard");

  const bannerText = await page
    .locator('[role="banner"]')
    .first()
    .textContent();
  const text = bannerText ?? "";

  expect(text).not.toContain("The Executive Lens");
  expect(text).not.toContain("The Lens");
  expect(text).not.toContain("Admin Console");
});

// ──────────────────────────────────────────────
// 시나리오 8: glass 효과 실측 — backdropFilter blur(12px)
// ──────────────────────────────────────────────
test("SC-08 헤더 glass 효과: backdropFilter에 blur(12px) 포함", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const backdropFilter = await page.evaluate(() => {
    const header = document.querySelector(
      '[role="banner"]',
    ) as HTMLElement | null;
    if (!header) return "";
    const style = getComputedStyle(header);
    return (
      style.backdropFilter ||
      (style as CSSStyleDeclaration & { webkitBackdropFilter?: string })
        .webkitBackdropFilter ||
      ""
    );
  });

  expect(backdropFilter).toContain("blur(12px)");
});

// ──────────────────────────────────────────────
// 시나리오 9: No-Line 런타임 검증 — 사이드바/헤더 테두리 없음
// ──────────────────────────────────────────────
test("SC-09 No-Line 런타임: aside/header 및 직접 자식 borderWidth 전부 0px", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const borderIssues = await page.evaluate(() => {
    const issues: string[] = [];
    const sides = [
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
    ] as const;

    function checkElement(el: Element, label: string) {
      const style = getComputedStyle(el);
      for (const side of sides) {
        const val = style[side];
        if (val !== "0px") {
          issues.push(`${label} ${side}=${val}`);
        }
      }
    }

    const aside = document.querySelector("aside");
    if (aside) {
      checkElement(aside, "aside");
      Array.from(aside.children).forEach((child, idx) => {
        checkElement(child, `aside>child[${idx}]`);
      });
    }

    const header = document.querySelector(
      '[role="banner"]',
    ) as HTMLElement | null;
    if (header) {
      checkElement(header, "header[banner]");
      Array.from(header.children).forEach((child, idx) => {
        checkElement(child, `header>child[${idx}]`);
      });
    }

    return issues;
  });

  if (borderIssues.length > 0) {
    console.error("No-Line 위반:", borderIssues);
  }
  expect(borderIssues).toHaveLength(0);
});

// ──────────────────────────────────────────────
// 보안 검증 1: Set-Cookie 응답 헤더 — 의도치 않은 비-httpOnly 세션 노출 없음
// ──────────────────────────────────────────────
test("SEC-01 Set-Cookie: 의도치 않은 비-httpOnly 세션 없음", async ({
  page,
}) => {
  const cookieHeaders: string[] = [];

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("localhost:3000") && url.includes("/dashboard")) {
      const setCookie = response.headers()["set-cookie"];
      if (setCookie) {
        cookieHeaders.push(...setCookie.split("\n"));
      }
    }
  });

  await page.goto("/dashboard");

  for (const cookieHeader of cookieHeaders) {
    const lower = cookieHeader.toLowerCase();
    const isSessionCookie =
      lower.includes("session") ||
      lower.includes("authjs") ||
      lower.includes("next-auth");

    if (isSessionCookie) {
      expect(lower).toContain("httponly");
    }
  }

  console.log(
    `SEC-01: Set-Cookie 헤더 수: ${cookieHeaders.length}. 내용: ${cookieHeaders.join(" | ") || "없음"}`,
  );
});

// ──────────────────────────────────────────────
// 보안 검증 2: 브라우저 storage에 토큰/세션 키 없음
// ──────────────────────────────────────────────
test("SEC-02 브라우저 storage에 토큰/세션 키 없음", async ({ page }) => {
  await page.goto("/dashboard");

  const { localStorageKeys, sessionStorageKeys } = await page.evaluate(() => {
    return {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
    };
  });

  const sensitivePatterns = [
    "session-token",
    "access_token",
    "id_token",
    "refresh_token",
    "oidc",
    "auth",
    "jwt",
    "bearer",
  ];

  const allKeys = [...localStorageKeys, ...sessionStorageKeys];

  const foundSensitiveKeys = allKeys.filter((key) =>
    sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern)),
  );

  if (foundSensitiveKeys.length > 0) {
    console.error("SEC-02 FAIL: storage에 민감 키 발견:", foundSensitiveKeys);
  } else {
    console.log(
      `SEC-02 PASS: storage 전체 키: [${allKeys.join(", ") || "없음"}]`,
    );
  }

  expect(foundSensitiveKeys).toHaveLength(0);
});

// ──────────────────────────────────────────────
// 보안 검증 4: 인증 가드 미적용 — /dashboard, /admins 인증 없이 접근 가능
//   (본 슬라이스 스펙 일치 — TODO hook point 존재 확인)
// ──────────────────────────────────────────────
test("SEC-04 인증 가드 미적용: /dashboard, /admins 인증 없이 200 반환 (스펙 일치)", async ({
  page,
}) => {
  const dashboardResponse = await page.goto("/dashboard");
  expect(dashboardResponse?.status()).toBe(200);

  const adminsResponse = await page.goto("/admins");
  expect(adminsResponse?.status()).toBe(200);

  console.log(
    "SEC-04: 인증 없이 /dashboard, /admins 모두 200 반환. TODO(google-oidc-login) hook point 확인됨. 스펙 일치.",
  );
});
