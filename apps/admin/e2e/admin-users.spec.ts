/**
 * admin-user-design E2E — admin-user-list-ui / admin-user-detail-ui 시나리오
 *
 * E2E 선별 기준:
 *   ✅ E2E 대상 (브라우저 실측 필요):
 *     LIST-01  탭 4개 존재 + aria-selected="true" 활성 탭 확인
 *     LIST-02  테이블 헤더 5개 컬럼 렌더
 *     LIST-03  이름 셀 링크 렌더 (text-primary)
 *     LIST-04  pending 행 — 승인+거절 버튼 둘 다 존재
 *     LIST-05  active 행 — 거절 버튼만 존재
 *     LIST-06  rejected 행 — 대기로 복구+승인으로 복구 버튼 존재
 *     LIST-07  상태 칩 색상 클래스 검증 (orange/blue/red)
 *     DETAIL-01 유저 정보 카드(lg:col-span-7) + 액션 카드(lg:col-span-5) 레이아웃
 *     DETAIL-02 아바타 또는 placeholder 존재
 *     DETAIL-03 상태 도트 존재
 *     DETAIL-04 정보 행 라벨 "상태", "역할", "등록일" 존재
 *     DETAIL-05 pending 상세 — 승인+거절 버튼
 *     DETAIL-06 active 상세 — 거절 버튼만
 *     DETAIL-07 rejected 상세 — 대기로 복구+승인으로 복구 버튼
 *     SEC-01    localStorage/sessionStorage에 토큰 키 없음
 *     SEC-02    NEXT_PUBLIC_* 환경변수로 백엔드 URL 미노출
 *
 *   ❌ 스킵 (단위/RTL로 커버):
 *     AdminUserStatusBadge 색상 클래스 단위 테스트 — 단일 컴포넌트 렌더 검증
 *     AdminUserActions 버튼 로직 — 단일 컴포넌트 입출력 검증
 *     adminUserKeys Query Key Factory — 유틸 함수 출력 검증
 *     statusLabel 매핑 — 데이터 변환 검증
 *
 * 인증 전략:
 *   Auth.js v5 Server Component guard(layout.tsx)가 active이므로,
 *   AUTH_SECRET으로 JWE 세션 쿠키를 직접 생성하여 context에 주입한다.
 *   (createJweSessionCookie 헬퍼 — hkdf + EncryptJWT)
 *
 * API Mock 전략:
 *   BFF proxy(/api/admin/users)를 page.route()로 mock.
 *   Server Component prefetch도 동일 경로를 호출하므로 같이 intercepted.
 */

import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { EncryptJWT, calculateJwkThumbprint, base64url } from "jose";
// @panva/hkdf: Auth.js v5(@auth/core)에서 사용하는 hkdf 구현
// Node.js 내장 crypto.hkdf와 달리 Uint8Array를 반환하여 jose와 호환됨
import { hkdf } from "@panva/hkdf";

// .env.local 로드 (playwright.config.ts에서도 로드하지만 worker에서 재확인)
loadEnv({ path: path.resolve(__dirname, "../.env.local") });

// ──────────────────────────────────────────────
// Auth Session Fixture
// ──────────────────────────────────────────────

/**
 * Auth.js v5(@auth/core) 호환 JWE 세션 쿠키 생성.
 *
 * @auth/core/jwt.js getDerivedEncryptionKey 로직 그대로 재현:
 *   hkdf("sha256", keyMaterial, salt, `Auth.js Generated Encryption Key (${salt})`, 64)
 *   salt = 쿠키 이름 ("authjs.session-token" for http localhost)
 *
 * kid: JWK thumbprint (calculateJwkThumbprint)
 * alg: dir, enc: A256CBC-HS512
 */
async function createJweSessionCookie(): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "";
  if (!secret) throw new Error("AUTH_SECRET 미설정 — .env.local 확인 필요");

  // http localhost → "authjs.session-token" (https → "__Secure-authjs.session-token")
  const salt = "authjs.session-token";
  const info = `Auth.js Generated Encryption Key (${salt})`;
  const enc = "A256CBC-HS512";

  const derivedKey = await hkdf("sha256", secret, salt, info, 64);

  const thumbprint = await calculateJwkThumbprint(
    { kty: "oct", k: base64url.encode(derivedKey) },
    `sha${derivedKey.byteLength << 3}`,
  );

  const now = Math.floor(Date.now() / 1000);

  const jwe = await new EncryptJWT({
    name: "E2E Test Admin",
    email: "e2e-test@example.com",
    picture: null,
    sub: "e2e-test-sub-12345",
    status: "active",
    role: "super_admin",
  })
    .setProtectedHeader({ alg: "dir", enc, kid: thumbprint })
    .setIssuedAt()
    .setExpirationTime(now + 86_400) // 24h
    .setJti(randomUUID())
    .encrypt(derivedKey);

  return jwe;
}

/**
 * context에 Auth.js 세션 쿠키를 주입한다.
 * localhost http이므로 쿠키 이름: "authjs.session-token" (Secure prefix 없음).
 */
async function injectAuthSession(context: BrowserContext): Promise<void> {
  const jwe = await createJweSessionCookie();
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: jwe,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 86_400,
    },
  ]);
}

// ──────────────────────────────────────────────
// API Fixtures
// ──────────────────────────────────────────────

const pendingUser = {
  id: "user-pending-1",
  email: "pending@example.com",
  name: "대기 사용자",
  picture: null,
  provider: "google",
  status: "pending",
  role: "admin",
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

const activeUser = {
  id: "user-active-1",
  email: "active@example.com",
  name: "활성 사용자",
  picture: null,
  provider: "google",
  status: "active",
  role: "admin",
  createdAt: "2024-01-10T00:00:00.000Z",
  updatedAt: "2024-01-12T00:00:00.000Z",
};

const rejectedUser = {
  id: "user-rejected-1",
  email: "rejected@example.com",
  name: "거절 사용자",
  picture: null,
  provider: "google",
  status: "rejected",
  role: "admin",
  createdAt: "2024-01-05T00:00:00.000Z",
  updatedAt: "2024-01-06T00:00:00.000Z",
};

const allUsers = [pendingUser, activeUser, rejectedUser];

// ──────────────────────────────────────────────
// Navigation helpers
// ──────────────────────────────────────────────

/**
 * 관리자 목록 BFF API를 mock하고 /admin/users 페이지로 이동.
 * 세션 쿠키는 beforeEach에서 이미 주입되어 있음.
 */
async function gotoAdminUsersListWithMock(
  page: Page,
  users = allUsers,
): Promise<void> {
  // BFF proxy route mock: GET /api/admin/users (query param 포함)
  await page.route("**/api/admin/users**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(users),
    });
  });

  await page.goto("/admin/users");

  // tablist가 보일 때까지 대기 (인증 가드 통과 + 컴포넌트 마운트)
  await page
    .locator('[role="tablist"]')
    .waitFor({ state: "visible", timeout: 15_000 });
}

/**
 * 관리자 상세 BFF API를 mock하고 /admin/users/[id] 페이지로 이동.
 */
async function gotoAdminUserDetailWithMock(
  page: Page,
  user: typeof pendingUser | typeof activeUser | typeof rejectedUser,
): Promise<void> {
  await page.route(`**/api/admin/users/${user.id}**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });

  await page.goto(`/admin/users/${user.id}`);

  // 유저 이름 h2 또는 에러 alert 대기
  await page
    .locator("h2, [role='alert']")
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });
}

// ──────────────────────────────────────────────
// beforeEach: 세션 쿠키 주입
// ──────────────────────────────────────────────

test.beforeEach(async ({ context }) => {
  await injectAuthSession(context);
});

// ──────────────────────────────────────────────
// LIST-01: 탭 4개 존재 + 활성 탭 aria-selected="true"
// ──────────────────────────────────────────────
test("LIST-01 탭 4개 존재 + 활성 탭 aria-selected=true", async ({ page }) => {
  await gotoAdminUsersListWithMock(page);

  const tablist = page.locator('[role="tablist"]');
  await expect(tablist).toBeVisible();

  const tabs = tablist.locator('[role="tab"]');
  await expect(tabs).toHaveCount(4);

  // 탭 레이블 확인
  await expect(tabs.nth(0)).toContainText("전체");
  await expect(tabs.nth(1)).toContainText("승인 대기");
  await expect(tabs.nth(2)).toContainText("활성");
  await expect(tabs.nth(3)).toContainText("거절됨");

  // 기본 선택 탭(전체)이 aria-selected="true"
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");

  // 나머지는 aria-selected="false"
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "false");
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "false");
});

// ──────────────────────────────────────────────
// LIST-01b: 탭 클릭 시 aria-selected 전환
// ──────────────────────────────────────────────
test("LIST-01b 탭 클릭 시 aria-selected 전환", async ({ page }) => {
  await gotoAdminUsersListWithMock(page, [pendingUser]);

  const tablist = page.locator('[role="tablist"]');
  const tabs = tablist.locator('[role="tab"]');

  // "승인 대기" 탭 클릭
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
});

// ──────────────────────────────────────────────
// LIST-02: 테이블 헤더 5개 컬럼 렌더
// ──────────────────────────────────────────────
test("LIST-02 테이블 헤더 사용자 이름·이메일·역할·상태·액션 존재", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page);

  await page
    .locator("table thead")
    .waitFor({ state: "visible", timeout: 8_000 });

  const thead = page.locator("table thead tr");
  await expect(thead).toContainText("사용자 이름");
  await expect(thead).toContainText("이메일");
  await expect(thead).toContainText("역할");
  await expect(thead).toContainText("상태");
  await expect(thead).toContainText("액션");
});

// ──────────────────────────────────────────────
// LIST-03: 이름 셀 링크 렌더 (text-primary)
// ──────────────────────────────────────────────
test("LIST-03 이름 셀이 링크로 렌더됨 (text-primary 클래스)", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page);

  await page
    .locator("table tbody")
    .waitFor({ state: "visible", timeout: 8_000 });

  // 첫 번째 행 이름 셀 — Next.js Link 컴포넌트
  const nameLink = page.locator("table tbody tr").first().locator("a").first();

  await expect(nameLink).toBeVisible();

  // text-primary 클래스 검증
  const classList = await nameLink.evaluate((el) => Array.from(el.classList));
  expect(classList.some((c) => c.includes("text-primary"))).toBe(true);

  // href가 /admin/users/[id] 패턴
  const href = await nameLink.getAttribute("href");
  expect(href).toMatch(/\/admin\/users\/.+/);
});

// ──────────────────────────────────────────────
// LIST-04: pending 행 — 승인+거절 버튼 둘 다 존재
// ──────────────────────────────────────────────
test("LIST-04 pending 행: 승인+거절 버튼 둘 다 존재", async ({ page }) => {
  await gotoAdminUsersListWithMock(page, [pendingUser]);

  await page
    .locator("table tbody")
    .waitFor({ state: "visible", timeout: 8_000 });

  const firstRow = page.locator("table tbody tr").first();

  await expect(firstRow.getByRole("button", { name: "승인" })).toBeVisible();
  await expect(firstRow.getByRole("button", { name: "거절" })).toBeVisible();
});

// ──────────────────────────────────────────────
// LIST-05: active 행 — 거절 버튼만 존재
// ──────────────────────────────────────────────
test("LIST-05 active 행: 거절 버튼만 존재, 승인 버튼 없음", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page, [activeUser]);

  await page
    .locator("table tbody")
    .waitFor({ state: "visible", timeout: 8_000 });

  const firstRow = page.locator("table tbody tr").first();

  await expect(firstRow.getByRole("button", { name: "거절" })).toBeVisible();
  await expect(firstRow.getByRole("button", { name: "승인" })).toHaveCount(0);
});

// ──────────────────────────────────────────────
// LIST-06: rejected 행 — 대기로 복구+승인으로 복구 버튼 존재
// ──────────────────────────────────────────────
test("LIST-06 rejected 행: 대기로 복구+승인으로 복구 버튼 존재", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page, [rejectedUser]);

  await page
    .locator("table tbody")
    .waitFor({ state: "visible", timeout: 8_000 });

  const firstRow = page.locator("table tbody tr").first();

  await expect(
    firstRow.getByRole("button", { name: "대기로 복구" }),
  ).toBeVisible();
  await expect(
    firstRow.getByRole("button", { name: "승인으로 복구" }),
  ).toBeVisible();
});

// ──────────────────────────────────────────────
// LIST-07: 상태 칩 색상 클래스 검증
// ──────────────────────────────────────────────
test("LIST-07 상태 칩: pending=orange, active=blue, rejected=red 클래스", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page, allUsers);

  await page
    .locator("table tbody")
    .waitFor({ state: "visible", timeout: 8_000 });

  const rows = page.locator("table tbody tr");

  // pending 행 (첫 번째) — orange 클래스
  const pendingBadge = rows
    .nth(0)
    .locator("span")
    .filter({ hasText: "승인 대기" });
  const pendingClass = await pendingBadge.evaluate((el) =>
    Array.from(el.classList).join(" "),
  );
  expect(pendingClass).toMatch(/orange/);

  // active 행 (두 번째) — blue 클래스
  const activeBadge = rows.nth(1).locator("span").filter({ hasText: "활성" });
  const activeClass = await activeBadge.evaluate((el) =>
    Array.from(el.classList).join(" "),
  );
  expect(activeClass).toMatch(/blue/);

  // rejected 행 (세 번째) — red 클래스
  const rejectedBadge = rows
    .nth(2)
    .locator("span")
    .filter({ hasText: "거절됨" });
  const rejectedClass = await rejectedBadge.evaluate((el) =>
    Array.from(el.classList).join(" "),
  );
  expect(rejectedClass).toMatch(/red/);
});

// ──────────────────────────────────────────────
// DETAIL-01: 유저 정보 카드(lg:col-span-7) + 액션 카드(lg:col-span-5) 레이아웃
// ──────────────────────────────────────────────
test("DETAIL-01 상세 페이지: 유저 정보 카드 + 액션 카드 레이아웃 존재", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, pendingUser);

  // 12컬럼 그리드 컨테이너
  const grid = page.locator(".grid-cols-12").first();
  await expect(grid).toBeVisible();

  // 유저 정보 카드 (lg:col-span-7)
  const infoCard = grid.locator(".lg\\:col-span-7");
  await expect(infoCard).toBeVisible();

  // 액션 카드 (lg:col-span-5)
  const actionCard = grid.locator(".lg\\:col-span-5");
  await expect(actionCard).toBeVisible();
});

// ──────────────────────────────────────────────
// DETAIL-02: 아바타 또는 placeholder 존재
// ──────────────────────────────────────────────
test("DETAIL-02 상세 페이지: 아바타 또는 placeholder 존재", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, pendingUser);

  // picture가 null이면 이니셜 placeholder div(w-16 h-16 rounded-full)
  // 있으면 img 태그
  const infoCard = page.locator(".lg\\:col-span-7");
  await expect(infoCard).toBeVisible();

  // rounded-full 요소 (아바타 영역) 존재 확인
  const avatarArea = infoCard.locator(".rounded-full").first();
  await expect(avatarArea).toBeVisible();

  console.log("DETAIL-02: 아바타 영역(rounded-full) 확인됨");
});

// ──────────────────────────────────────────────
// DETAIL-03: 상태 도트 존재
// ──────────────────────────────────────────────
test("DETAIL-03 상세 페이지: 상태 도트 존재 (아바타 영역 내 span)", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, activeUser);

  // 상태 도트: 아바타 영역 내 작은 span (border-4 border-white)
  // bg-green-500(active), bg-amber-500(pending), bg-red-500(rejected)
  const statusDot = page
    .locator("span")
    .filter({ has: page.locator(":scope.border-4") })
    .or(page.locator("span.border-4"))
    .first();

  // 좀 더 유연하게: 아바타 컨테이너(relative div) 안의 span 중 색상 클래스 있는 것
  const avatarContainer = page.locator(".relative.flex-shrink-0").first();
  await expect(avatarContainer).toBeVisible();

  const dotSpan = avatarContainer.locator("span");
  await expect(dotSpan).toBeVisible();

  // active = bg-green-500
  const dotClass = await dotSpan.evaluate((el) =>
    Array.from(el.classList).join(" "),
  );
  expect(dotClass).toContain("bg-green-500");

  console.log(`DETAIL-03: 상태 도트 클래스: ${dotClass}`);
});

// ──────────────────────────────────────────────
// DETAIL-04: 정보 행 라벨 "상태", "역할", "등록일" 존재
// ──────────────────────────────────────────────
test("DETAIL-04 상세 페이지: 정보 행 라벨 상태·역할·등록일 존재", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, pendingUser);

  // 정보 카드 내부 라벨 (uppercase tracking-wider 스타일 p 태그)
  const infoCard = page.locator(".lg\\:col-span-7");

  await expect(infoCard.getByText("상태", { exact: true })).toBeVisible();
  await expect(infoCard.getByText("역할", { exact: true })).toBeVisible();
  await expect(infoCard.getByText("등록일", { exact: true })).toBeVisible();
});

// ──────────────────────────────────────────────
// DETAIL-05: pending 상세 — 승인+거절 버튼
// ──────────────────────────────────────────────
test("DETAIL-05 pending 상세: 승인+거절 버튼 둘 다 존재", async ({ page }) => {
  await gotoAdminUserDetailWithMock(page, pendingUser);

  const actionCard = page.locator(".lg\\:col-span-5");
  await expect(actionCard).toBeVisible();

  await expect(actionCard.getByRole("button", { name: "승인" })).toBeVisible();
  await expect(actionCard.getByRole("button", { name: "거절" })).toBeVisible();
});

// ──────────────────────────────────────────────
// DETAIL-06: active 상세 — 거절 버튼만
// ──────────────────────────────────────────────
test("DETAIL-06 active 상세: 거절 버튼만 존재, 승인 버튼 없음", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, activeUser);

  const actionCard = page.locator(".lg\\:col-span-5");
  await expect(actionCard).toBeVisible();

  await expect(actionCard.getByRole("button", { name: "거절" })).toBeVisible();
  await expect(actionCard.getByRole("button", { name: "승인" })).toHaveCount(0);
});

// ──────────────────────────────────────────────
// DETAIL-07: rejected 상세 — 대기로 복구+승인으로 복구
// ──────────────────────────────────────────────
test("DETAIL-07 rejected 상세: 대기로 복구+승인으로 복구 버튼 존재", async ({
  page,
}) => {
  await gotoAdminUserDetailWithMock(page, rejectedUser);

  const actionCard = page.locator(".lg\\:col-span-5");
  await expect(actionCard).toBeVisible();

  await expect(
    actionCard.getByRole("button", { name: "대기로 복구" }),
  ).toBeVisible();
  await expect(
    actionCard.getByRole("button", { name: "승인으로 복구" }),
  ).toBeVisible();
});

// ──────────────────────────────────────────────
// SEC-01: localStorage/sessionStorage에 토큰/세션 키 없음
// ──────────────────────────────────────────────
test("SEC-01 /admin/users 페이지 storage에 토큰 키 없음", async ({ page }) => {
  await gotoAdminUsersListWithMock(page);

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
// SEC-02: NEXT_PUBLIC_* 환경변수로 백엔드 URL 미노출
// ──────────────────────────────────────────────
test("SEC-02 window.__NEXT_DATA__에 백엔드 URL(localhost:3001, API_URL) 미노출", async ({
  page,
}) => {
  await gotoAdminUsersListWithMock(page);

  const nextDataStr = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return JSON.stringify((window as any).__NEXT_DATA__ ?? {});
  });

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
  } else {
    console.log("SEC-02 PASS: __NEXT_DATA__에 백엔드 URL 미노출");
  }

  expect(exposedPatterns).toHaveLength(0);
});
