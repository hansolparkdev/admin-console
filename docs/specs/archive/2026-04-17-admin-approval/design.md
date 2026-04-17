## Context

현재 Auth.js v5 + Google OIDC로 인증하고, `ALLOWED_DOMAINS` / `ALLOWED_EMAILS` 환경변수로 허용 여부를 결정한다. Prisma User 모델에는 인증 공급자 정보만 있고 승인 상태(status)나 역할(role) 컬럼이 없다. 관리자 목록·승인·거절 UI 및 API가 전혀 없는 상태다.

## Goals / Non-Goals

**Goals:**
- 권한 관리의 소스 오브 트루스를 환경변수에서 DB로 이전한다.
- 모든 Google 계정은 로그인 시도는 할 수 있으나, DB `status = active`인 사용자만 콘솔에 진입한다.
- 최초 사용자(DB 관리자 0명)는 재배포·수동 개입 없이 자동으로 `active + super_admin`이 된다.
- `pending` / `rejected` 사용자는 상태별 안내 후 즉시 로그아웃되어 콘솔에 진입하지 못한다.
- super_admin은 앱 내부에서 관리자를 승인·거절·상태 복구할 수 있다.

**Non-Goals:**
- 관리자 목록·상세 화면의 시각 디자인 (Stitch 이후 별도 단계).
- super_admin 외 세분화된 RBAC 확장.
- 승인·거절 시 이메일/알림 발송.
- 감사 로그 UI.
- 관리자 자가 탈퇴, 역할 위임·회수, 일괄 처리.

## Decisions

### 1. User 상태 모델: 3-state FSM

```
(없음) ──로그인 최초──► pending ──승인──► active
                           │                │
                         거절             거절
                           │                │
                           ▼                ▼
                        rejected ◄──────────┘
                           │
                     되돌리기(복구)
                       /       \
                  pending    active
```

**이유**: `pending`(심사 대기) → `active`(승인) → `rejected`(거절) 3상태가 가장 단순하고 감사 추적에 충분하다. `rejected`에서 `pending` / `active` 복구를 허용하는 것은 운영 유연성 우선 결정(미결 사항 1 해소)으로, super_admin만 수행할 수 있어 남용 위험이 낮다.

### 2. 부트스트랩 규칙: DB 트랜잭션 기반 경합 방지

로그인 콜백 시 `SELECT COUNT(*) FROM users WHERE role IN ('super_admin', 'admin')` → 0이면 해당 사용자를 `active + super_admin`으로 upsert한다. 경합 방지를 위해 `upsert` + unique constraint + DB 트랜잭션으로 단 1명만 super_admin이 되도록 보장한다. 나머지 동시 로그인자는 `pending`으로 fallback된다.

**이유**: 애플리케이션 레벨 락은 다중 인스턴스에서 안전하지 않다. DB unique constraint + 트랜잭션이 가장 신뢰성 있는 단일 진실원이다.

### 3. 로그인 차단 전달 방식: Auth.js signIn 콜백 + 에러 reason

Auth.js `signIn` 콜백에서 `{ allowed: false, reason: "pending_approval" | "rejected" }`를 반환하면 Auth.js가 `/api/auth/error?error=...`로 리디렉션한다. 로그인 UI는 URL 파라미터의 `error` 값을 파싱해 상태별 토스트를 노출하고 `signOut()`을 호출한다.

**이유**: 별도 API 엔드포인트 없이 Auth.js 내장 에러 흐름을 활용해 구현 범위를 최소화한다. 쿠키 기반 세션을 절대 발급하지 않으므로 보안 원칙(httpOnly 쿠키 + BFF)과 충돌하지 않는다.

### 4. session-guard 강화: Auth.js session + DB status 이중 체크

`(app)/layout.tsx`에서 `auth()` 세션 체크 후, 세션이 있더라도 DB `status !== 'active'`인 경우 `/login`으로 리디렉션한다. 세션 오브젝트에 `status`를 포함시켜 매 요청마다 DB를 조회하지 않도록 하되, 역할 변경 시 강제 세션 재발급 또는 TTL 기반 재검증을 고려한다.

**이유**: 승인 취소 또는 거절 전환 시 기존 세션이 유효한 상태로 남으면 보안 구멍이 생긴다. 세션에 status를 포함하고 변경 시 세션을 무효화하는 방식이 가장 안전하다.

### 5. 미결 사항 해소: rejected 되돌리기 허용

운영 유연성을 우선시해 super_admin이 `rejected` 상태를 `pending` 또는 `active`로 복구할 수 있도록 결정한다. 복구 이력은 DB 업데이트 타임스탬프(`updatedAt`)로 추적한다.

**이유**: 실수로 거절한 경우나 운영 정책 변경 시 재배포 없이 조치할 수 있어야 한다. super_admin 전용 기능이므로 권한 남용 위험이 낮다.

## API 엔드포인트 목록

| 메서드 | 경로 | 설명 | 접근 권한 |
|--------|------|------|-----------|
| GET | `/admin/users` | 관리자 목록 조회 (status 필터) | super_admin |
| GET | `/admin/users/:id` | 관리자 상세 조회 | super_admin |
| PATCH | `/admin/users/:id/approve` | 관리자 승인 (status → active) | super_admin |
| PATCH | `/admin/users/:id/reject` | 관리자 거절 (status → rejected) | super_admin |
| PATCH | `/admin/users/:id/restore` | 상태 복구 (rejected → pending/active) | super_admin |

모든 엔드포인트는 BFF `apps/admin/src/app/api/[...proxy]/route.ts`를 통해 same-origin `/api/*`로 접근한다.

## Risks / Trade-offs

- **세션-DB 상태 불일치**: 세션 발급 이후 DB status가 변경되면 기존 세션이 유효 상태로 남을 수 있다. → Auth.js 세션에 status를 포함하고, status 변경 시 해당 사용자 세션을 강제 무효화한다(Auth.js adapter 레벨에서 처리 또는 TTL 단축).
- **부트스트랩 경합**: 첫 배포 시 동시 로그인이 발생하면 의도하지 않은 사용자가 super_admin이 될 수 있다. → DB 트랜잭션 + unique constraint로 1명만 보장. 추가로 배포 시 super_admin 초기 설정을 운영 가이드에 명시한다.
- **Auth.js 에러 URL 파싱 의존**: 에러 reason을 URL 파라미터로 전달하면 사용자가 URL을 조작할 수 있다. → UI에서 reason은 표시용이며, 실제 차단은 session-guard가 담당하므로 보안 영향 없음.
