## Why

조직 Google 계정 기반의 중앙화된 접근 통제가 없어 콘솔 진입이 불가능한 상태다. Auth.js v5 + Google OIDC를 이용해 BFF 패턴(httpOnly 쿠키, same-origin `/api/*`)으로 인증 흐름을 구현하고, 비인가 계정은 서버에서 차단한다.

## What Changes

- `apps/admin`에 `(public)/login` 로그인 화면 신규 추가 (스플릿 레이아웃, 디자인 충실도 strict)
- `apps/admin`에 Auth.js v5 세션 Provider 및 `auth()` 가드를 `(app)/layout.tsx`에 연결
- `apps/admin`에 Google OIDC 콜백 및 sign-in/sign-out BFF Route Handler 신규 추가
- `apps/admin`에 미인증 접근 시 로그인 화면으로 유도하고 원래 경로 복귀 처리
- `apps/api`에 Google OIDC 토큰 검증 + 조직 계정 허용 규칙 집행 모듈 신규 추가
- `apps/api`에 세션 발급·파기·조회 엔드포인트 신규 추가
- `apps/api`에 인증 Guard(AuthGuard) 신규 추가 — 미인증 요청에 401 응답

## Capabilities

### New Capabilities

- `google-oidc-auth`: Google OIDC 토큰 검증, 조직 계정 허용 규칙, 세션 발급·파기 (apps/api)
- `login-ui`: 로그인 화면 렌더링, Google 로그인 버튼, 에러 상태 표시 (apps/admin)
- `session-guard`: 미인증 접근 차단, 원래 경로 복귀, 세션 만료 처리 (apps/admin)

### Modified Capabilities

- `app-entry`: 루트 진입점(`app/page.tsx`)에서 인증 상태 확인 후 경로 분기 변경
- `shell-layout`: `(app)/layout.tsx`에 `auth()` 가드 연결 — 미인증 시 로그인 화면으로 redirect
- `sidebar-navigation`: 세션 사용자 정보(이름, 이메일) 헤더/사이드바에 노출

## Impact

```
apps/admin/src/app/page.tsx
apps/admin/src/app/(app)/layout.tsx
apps/admin/src/app/(public)/login/page.tsx                 (신규)
apps/admin/src/app/api/auth/[...nextauth]/route.ts         (신규)
apps/admin/src/features/auth/api.ts                        (신규)
apps/admin/src/features/auth/queries.ts                    (신규)
apps/admin/src/features/auth/components/LoginForm.tsx      (신규)
apps/admin/src/features/auth/components/LoginErrorBanner.tsx (신규)
apps/admin/src/lib/auth.ts                                 (신규)
apps/admin/src/components/providers/SessionProvider.tsx    (신규)
apps/admin/src/components/layout/Header.tsx                (수정)
apps/api/src/auth/auth.module.ts                           (신규)
apps/api/src/auth/auth.controller.ts                       (신규)
apps/api/src/auth/auth.service.ts                          (신규)
apps/api/src/auth/google.strategy.ts                       (신규)
apps/api/src/auth/auth.guard.ts                            (신규)
apps/api/src/auth/dto/google-callback.dto.ts               (신규)
apps/api/prisma/schema.prisma                              (수정 — Session/User 모델)
```

## Meta

- feature: google-oidc-login
- type: fullstack
- package: apps/admin, apps/api

프리로드: folder-conventions.md · dev-flow.md · forbidden-patterns.md
