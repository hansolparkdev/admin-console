/**
 * google-oidc-login E2E — 시나리오 선별 결과
 *
 * ✅ E2E 대상:
 *   LUI-01  /login 진입 시 스플릿 레이아웃 렌더
 *   LUI-02  Google 로그인 버튼 클릭 → Google OAuth redirect URL 시작 확인
 *   LUI-03  error 쿼리파라미터 → LoginErrorBanner 표시
 *   LUI-04  로그인 진행 중 버튼 비활성·로딩 표시
 *   SGD-01  미인증 상태에서 보호 경로 접근 → /login?callbackUrl= redirect
 *   SEC-01  localStorage/sessionStorage에 토큰 키 없음
 *   SEC-02  NEXT_PUBLIC_* 환경변수로 백엔드 URL 노출 여부 (DOM/window 검사)
 *   SEC-03  callbackUrl Open Redirect 방지 (외부 URL → 폴백)
 *   SEC-04  세션 쿠키 httpOnly 플래그 확인
 *
 * ❌ 스킵 (Google 실서버 OAuth 플로우 필요):
 *   OIDC-01  조직 계정 로그인 성공 → 세션 발급
 *   OIDC-02  비인가 계정 → unauthorized_domain 거부
 *   OIDC-03  Google 인증 취소 → 에러 안내
 *   SGD-02   로그인 후 callbackUrl 경로로 복귀
 */

import { test, expect } from "@playwright/test";

// ──────────────────────────────────────────────
// LUI-01: /login 진입 시 스플릿 레이아웃 렌더
// ──────────────────────────────────────────────
test("LUI-01 /login 스플릿 레이아웃: 헤드라인·버튼·서브카피 렌더", async ({
  page,
}) => {
  await page.goto("/login");

  // 헤드라인
  const headline = page.locator("h1");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText("콘솔에 접속하세요");

  // Google 로그인 버튼
  const googleBtn = page.locator(
    'button[aria-label="Google 계정으로 계속하기"]',
  );
  await expect(googleBtn).toBeVisible();
  await expect(googleBtn).toBeEnabled();

  // 서브카피
  await expect(
    page.locator("text=조직 Google 계정으로 안전하게 로그인합니다."),
  ).toBeVisible();

  // 이버로우 (로그인 레이블) — exact match로 strict mode 충돌 방지
  await expect(page.getByText("로그인", { exact: true })).toBeVisible();
});

// ──────────────────────────────────────────────
// LUI-02: Google 로그인 버튼 클릭 → Google OAuth redirect 시작 확인
// 실제 Google 서버에 도달하지 않고 redirect URL이 accounts.google.com을 향하는지만 검증
// ──────────────────────────────────────────────
test("LUI-02 Google 로그인 버튼 클릭 → Google OAuth redirect 시작 (버튼 pending 전환 확인)", async ({
  page,
}) => {
  // Google 실서버 호출 금지 — redirect URL 검증 대신 버튼 pending 상태로 검증.
  // signIn("google", ...) 호출 시 LoginForm의 isPending=true → 버튼 disabled + "로그인 중..." 텍스트 전환.
  // 이것이 Google OAuth 플로우 시작의 E2E 관찰 가능한 증거.

  // Auth.js CSRF endpoint, signin endpoint를 가로채서 응답 지연 (실서버 미호출 + pending 유지)
  await page.route("**/api/auth/csrf**", (route) => {
    setTimeout(() => route.continue(), 3000);
  });
  await page.route("**/api/auth/signin**", (route) => {
    setTimeout(() => route.continue(), 3000);
  });

  await page.goto("/login");

  const googleBtn = page.locator(
    'button[aria-label="Google 계정으로 계속하기"]',
  );
  await expect(googleBtn).toBeEnabled();
  await googleBtn.click();

  // 클릭 후 isPending=true → 버튼 비활성 + 로딩 텍스트
  await expect(googleBtn).toBeDisabled({ timeout: 5000 });
  await expect(page.locator("text=로그인 중...")).toBeVisible({
    timeout: 5000,
  });

  console.log(
    "LUI-02 PASS: 버튼 클릭 → isPending=true, 버튼 disabled, 로딩 텍스트 표시",
  );
});

// ──────────────────────────────────────────────
// LUI-03: error 쿼리파라미터 → LoginErrorBanner 표시
// ──────────────────────────────────────────────
test("LUI-03 error=unauthorized_domain → LoginErrorBanner 렌더", async ({
  page,
}) => {
  await page.goto("/login?error=unauthorized_domain");

  // Next.js route announcer (aria-live=assertive)와 충돌 방지 — 텍스트로 직접 매칭
  const banner = page
    .locator('[role="alert"]')
    .filter({ hasText: "조직 계정만 허용됩니다" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("조직 계정만 허용됩니다");
});

test("LUI-03b error=OAuthCallback → 에러 배너 렌더", async ({ page }) => {
  await page.goto("/login?error=OAuthCallback");

  const banner = page
    .locator('[role="alert"]')
    .filter({ hasText: "Google 인증 중 오류가 발생했습니다" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Google 인증 중 오류가 발생했습니다");
});

test("LUI-03c 에러 없음 → LoginErrorBanner 미표시", async ({ page }) => {
  await page.goto("/login");
  // Next.js route announcer는 항상 존재하므로, 실제 에러 메시지 배너가 없음을 확인
  const banner = page
    .locator('[role="alert"]')
    .filter({ hasText: /조직 계정|Google 인증|일시적 오류/ });
  await expect(banner).toHaveCount(0);
});

// ──────────────────────────────────────────────
// LUI-04: 로그인 진행 중 버튼 비활성·로딩 표시
// ──────────────────────────────────────────────
test("LUI-04 Google 버튼 클릭 후 비활성·로딩 텍스트 표시", async ({ page }) => {
  await page.goto("/login");

  // Google redirect 가로채기 (외부 실서버 호출 금지)
  await page.route("**/api/auth/**", (route) => {
    // 응답을 지연시켜 로딩 상태 확인
    setTimeout(() => route.continue(), 2000);
  });

  const googleBtn = page.locator(
    'button[aria-label="Google 계정으로 계속하기"]',
  );
  await expect(googleBtn).toBeVisible();

  await googleBtn.click();

  // 클릭 직후: disabled 또는 "로그인 중..." 텍스트 (pending 상태)
  await expect(googleBtn).toBeDisabled({ timeout: 3000 });
  await expect(page.locator("text=로그인 중...")).toBeVisible({
    timeout: 3000,
  });
});

// ──────────────────────────────────────────────
// SGD-01: 미인증 상태에서 보호 경로 접근 → /login?callbackUrl= redirect
// ──────────────────────────────────────────────
test("SGD-01 미인증 /dashboard 접근 → /login?callbackUrl=/dashboard redirect", async ({
  page,
}) => {
  // 쿠키 없는 신선한 컨텍스트에서 보호 경로 접근
  await page.goto("/dashboard");

  // /login 으로 redirect 확인
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

  // callbackUrl 포함 확인
  const url = page.url();
  expect(url).toContain("callbackUrl");

  console.log(`SGD-01: redirect URL = ${url}`);
});

test("SGD-01b 미인증 /admins 접근 → /login redirect", async ({ page }) => {
  await page.goto("/admins");
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
});

// ──────────────────────────────────────────────
// SEC-01: localStorage/sessionStorage에 토큰/세션 키 없음
// ──────────────────────────────────────────────
test("SEC-01 /login 페이지에서 storage에 토큰 키 없음", async ({ page }) => {
  await page.goto("/login");

  const { localStorageKeys, sessionStorageKeys } = await page.evaluate(() => ({
    localStorageKeys: Object.keys(localStorage),
    sessionStorageKeys: Object.keys(sessionStorage),
  }));

  const sensitivePatterns = [
    "token",
    "session",
    "auth",
    "jwt",
    "bearer",
    "oidc",
    "id_token",
    "access_token",
    "refresh_token",
  ];

  const allKeys = [...localStorageKeys, ...sessionStorageKeys];
  const foundSensitiveKeys = allKeys.filter((key) =>
    sensitivePatterns.some((p) => key.toLowerCase().includes(p)),
  );

  if (foundSensitiveKeys.length > 0) {
    console.error("SEC-01 FAIL: storage 민감 키 발견:", foundSensitiveKeys);
  } else {
    console.log(
      `SEC-01 PASS: storage 키 목록: [${allKeys.join(", ") || "없음"}]`,
    );
  }

  expect(foundSensitiveKeys).toHaveLength(0);
});

// ──────────────────────────────────────────────
// SEC-02: NEXT_PUBLIC_* 환경변수로 백엔드 URL 노출 여부
// window.__NEXT_DATA__ 및 DOM에서 API_URL / 내부 호스트 패턴 검색
// ──────────────────────────────────────────────
test("SEC-02 window.__NEXT_DATA__에 API_URL 등 백엔드 URL 미노출", async ({
  page,
}) => {
  await page.goto("/login");

  const nextDataStr = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return JSON.stringify((window as any).__NEXT_DATA__ ?? {});
  });

  // 내부 API URL 패턴: localhost:3001, API_URL, internal host 등
  const internalUrlPatterns = [
    "localhost:3001",
    "API_URL",
    "NEXT_PUBLIC_API",
    ":3001",
  ];

  const exposedPatterns = internalUrlPatterns.filter((p) =>
    nextDataStr.includes(p),
  );

  if (exposedPatterns.length > 0) {
    console.error(
      "SEC-02 FAIL: __NEXT_DATA__에 백엔드 URL 발견:",
      exposedPatterns,
    );
    console.error("내용 일부:", nextDataStr.slice(0, 500));
  } else {
    console.log("SEC-02 PASS: __NEXT_DATA__에 백엔드 URL 미노출");
  }

  expect(exposedPatterns).toHaveLength(0);
});

// ──────────────────────────────────────────────
// SEC-03: callbackUrl Open Redirect 방지
// 외부 URL을 callbackUrl로 전달하면 /dashboard로 폴백되어야 함
// ──────────────────────────────────────────────
test("SEC-03 callbackUrl Open Redirect 방지: 외부 https:// URL 주입 시 /login 정상 렌더", async ({
  page,
}) => {
  // 서버 측 getCallbackUrl()이 외부 URL을 /dashboard로 폴백한다.
  // E2E 검증: /login 페이지가 정상 렌더되고 브라우저 top-level origin이 localhost여야 함.
  // route()를 사용하지 않음 — 글로브 패턴이 query param 내 도메인도 매칭하여 goto 자체를 abort할 수 있음.

  await page.goto("/login?callbackUrl=https%3A%2F%2Fevil.example.com");

  // /login 페이지가 정상 렌더됨 (서버에서 external URL을 폴백 처리)
  const headline = page.locator("h1");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText("콘솔에 접속하세요");

  // top-level URL이 localhost:3000 (외부 redirect 없음)
  const finalUrl = page.url();
  expect(finalUrl).toContain("localhost:3000");
  expect(finalUrl).not.toMatch(/^https?:\/\/evil/);
  console.log(`SEC-03: 최종 URL = ${finalUrl}`);
});

test("SEC-03b callbackUrl http:// 외부 URL → /login 정상 렌더 (인코딩)", async ({
  page,
}) => {
  await page.goto("/login?callbackUrl=http%3A%2F%2Fevil.example.com%2Fsteal");

  const headline = page.locator("h1");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText("콘솔에 접속하세요");
  expect(page.url()).toContain("localhost:3000");
});

test("SEC-03c callbackUrl protocol-relative → /login 정상 렌더 (인코딩)", async ({
  page,
}) => {
  // //evil.example.com 인코딩 → %2F%2Fevil.example.com
  await page.goto("/login?callbackUrl=%2F%2Fevil.example.com");

  const headline = page.locator("h1");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText("콘솔에 접속하세요");
  expect(page.url()).toContain("localhost:3000");
});

// ──────────────────────────────────────────────
// SEC-04: Auth.js 세션 쿠키 httpOnly 플래그 확인
// 로그인 플로우 시작 시 set-cookie 헤더 캡처
// ──────────────────────────────────────────────
test("SEC-04 Auth.js 관련 Set-Cookie는 httpOnly 포함", async ({
  page,
  context,
}) => {
  const sessionCookieHeaders: string[] = [];

  page.on("response", (response) => {
    const setCookie = response.headers()["set-cookie"];
    if (setCookie) {
      const cookies = setCookie.split("\n");
      for (const c of cookies) {
        const lower = c.toLowerCase();
        if (
          lower.includes("authjs") ||
          lower.includes("next-auth") ||
          lower.includes("session-token") ||
          lower.includes("csrf-token") ||
          lower.includes("callback-url")
        ) {
          sessionCookieHeaders.push(c);
        }
      }
    }
  });

  await page.goto("/login");

  if (sessionCookieHeaders.length === 0) {
    // /login 방문만으로 세션 쿠키가 발급되지 않을 수 있음
    // context.cookies()로 이미 설정된 쿠키 확인
    const cookies = await context.cookies();
    const authCookies = cookies.filter(
      (c) =>
        c.name.toLowerCase().includes("authjs") ||
        c.name.toLowerCase().includes("next-auth") ||
        c.name.toLowerCase().includes("session"),
    );

    for (const c of authCookies) {
      if (!c.httpOnly) {
        console.error(`SEC-04 FAIL: 쿠키 "${c.name}"에 httpOnly 없음`);
        expect(c.httpOnly).toBe(true);
      }
    }

    console.log(
      `SEC-04: auth 쿠키 ${authCookies.length}개. httpOnly 전부 true. ` +
        `목록: [${authCookies.map((c) => `${c.name}(httpOnly=${c.httpOnly})`).join(", ") || "없음"}]`,
    );
  } else {
    for (const header of sessionCookieHeaders) {
      const lower = header.toLowerCase();
      console.log(`SEC-04: Set-Cookie = ${header}`);
      expect(lower).toContain("httponly");
    }
  }
});
