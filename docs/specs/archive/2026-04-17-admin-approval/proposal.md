## Why

현재 ALLOWED_DOMAINS/ALLOWED_EMAILS 환경변수로 로그인 허용 여부를 통제하고 있어, 신규 관리자 추가 시 재배포가 필요하다. 권한 관리의 소스 오브 트루스를 DB로 이전하고, 신청·승인 워크플로우를 앱 내부에서 처리함으로써 운영 자율성과 감사 추적을 확보한다.

## What Changes

- User 모델에 `status(pending|active|rejected)`, `role(super_admin|admin)` 컬럼 추가 및 Prisma migration
- Google OIDC 로그인 콜백에서 환경변수 허용 체크 제거, DB status 조회 방식으로 교체
- DB 관리자 0명일 때 최초 로그인 사용자를 자동으로 `active + super_admin`으로 등록하는 부트스트랩 로직 추가
- `pending` / `rejected` 사용자가 로그인 시 상태별 토스트 노출 후 즉시 자동 로그아웃
- `(app)` 라우트 그룹 진입 시 `active` 상태만 허용하도록 session-guard 강화
- super_admin 전용 관리자 목록 화면(`/admin/users`) 및 상세 화면(`/admin/users/[id]`) 신규 추가
- 관리자 상세 화면에서 `rejected` 상태를 `pending` 또는 `active`로 되돌리는 기능 포함 (운영 유연성 우선 결정)

## Capabilities

### New Capabilities
- `admin-user-management`: 관리자 사용자 상태(pending/active/rejected) 관리, super_admin 전용 목록·상세·승인·거절·상태 복구 API 및 화면

### Modified Capabilities
- `google-oidc-auth`: 환경변수 기반 허용 체크 제거 → DB status 조회 방식으로 변경, 부트스트랩 규칙 추가, User 모델에 status/role 컬럼 추가
- `login-ui`: `pending` / `rejected` 사용자에 대한 상태별 토스트 안내 및 자동 로그아웃 처리 추가
- `session-guard`: `active` 상태가 아닌 사용자(`pending` / `rejected`)도 `(app)` 라우트 그룹 진입 차단

## Impact

**apps/api**
- `prisma/schema.prisma` — User 모델 status/role 컬럼 추가
- `prisma/migrations/` — 신규 migration 파일
- `src/auth/auth.service.ts` — checkAllowed 로직 교체, 부트스트랩 로직 추가
- `src/auth/auth.module.ts` — AdminUsers 모듈 의존성 연결
- `src/admin-users/admin-users.controller.ts` — 신규 컨트롤러
- `src/admin-users/admin-users.service.ts` — 신규 서비스
- `src/admin-users/admin-users.module.ts` — 신규 모듈
- `src/admin-users/dto/update-admin-user.dto.ts` — 신규 DTO
- `src/admin-users/types.ts` — 신규 타입

**apps/admin**
- `src/features/auth/api.ts` — 로그인 에러 응답 파싱 (pending/rejected reason 처리)
- `src/features/auth/components/LoginForm.tsx` — 상태별 토스트 + 자동 로그아웃
- `src/app/(app)/layout.tsx` — session-guard: active 상태 체크 강화
- `src/app/(app)/admin/users/page.tsx` — 신규 목록 페이지
- `src/app/(app)/admin/users/[id]/page.tsx` — 신규 상세 페이지
- `src/features/admin-users/api.ts` — 신규 fetcher
- `src/features/admin-users/queries.ts` — 신규 Query Key Factory + hooks
- `src/features/admin-users/components/AdminUserTable.tsx` — 신규
- `src/features/admin-users/components/AdminUserStatusBadge.tsx` — 신규
- `src/features/admin-users/components/AdminUserActions.tsx` — 신규
- `src/features/admin-users/types.ts` — 신규 타입

## Meta
- feature: admin-approval
- type: fullstack
- package: apps/admin, apps/api

프리로드: folder-conventions.md · dev-flow.md · forbidden-patterns.md
