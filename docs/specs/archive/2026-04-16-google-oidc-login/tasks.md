## 1. apps/api — Auth 모듈 기반 구축

- [x] 1.1 Prisma 스키마에 User·Account 모델 추가 및 마이그레이션 생성
  - 수정 파일: `apps/api/prisma/schema.prisma`
- [x] 1.2 AuthModule, AuthController, AuthService 뼈대 생성
  - 수정 파일: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`
- [x] 1.3 GoogleStrategy (Passport) 구현 — 허용 도메인·이메일 검증 집행
  - 수정 파일: `apps/api/src/auth/google.strategy.ts`
- [x] 1.4 AuthGuard (NestJS) 구현 — 미인증 요청 시 401 응답
  - 수정 파일: `apps/api/src/auth/auth.guard.ts`
- [x] 1.5 Google Callback DTO 정의
  - 수정 파일: `apps/api/src/auth/dto/google-callback.dto.ts`
- [x] 1.6 AppModule에 AuthModule 등록
  - 수정 파일: `apps/api/src/app.module.ts`

## 2. apps/api — 인증 엔드포인트 구현

- [x] 2.1 `POST /auth/verify` — Google ID Token 검증 + 조직 계정 허용 규칙 응답
  - 수정 파일: `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`
- [x] 2.2 `GET /auth/me` — 세션 사용자 정보 반환 (AuthGuard 적용)
  - 수정 파일: `apps/api/src/auth/auth.controller.ts`
- [x] 2.3 `POST /auth/logout` — 세션 파기 응답
  - 수정 파일: `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`

## 3. apps/admin — Auth.js v5 설정

- [x] 3.1 Auth.js v5 설정 파일(`lib/auth.ts`) 생성 — Google Provider, signIn 콜백(apps/api 검증 호출), JWT 설정
  - 수정 파일: `apps/admin/src/lib/auth.ts`
- [x] 3.2 Auth.js Route Handler 생성
  - 수정 파일: `apps/admin/src/app/api/auth/[...nextauth]/route.ts`
- [x] 3.3 SessionProvider 래퍼 컴포넌트 생성
  - 수정 파일: `apps/admin/src/components/providers/SessionProvider.tsx`
- [x] 3.4 RootLayout에 SessionProvider 추가
  - 수정 파일: `apps/admin/src/app/layout.tsx`

## 4. apps/admin — 세션 가드 구현

- [x] 4.1 `(app)/layout.tsx`에서 `auth()` 호출 — 미인증 시 `/login?callbackUrl=...` redirect
  - 수정 파일: `apps/admin/src/app/(app)/layout.tsx`
- [x] 4.2 루트 `page.tsx`에 세션 확인 후 경로 분기 추가
  - 수정 파일: `apps/admin/src/app/page.tsx`

## 5. apps/admin — 로그인 화면 UI 구현

- [x] 5.1 로그인 화면 서버 컴포넌트 생성 — `searchParams`에서 error 코드 수신
  - 수정 파일: `apps/admin/src/app/(public)/login/page.tsx`
- [x] 5.2 LoginForm 클라이언트 컴포넌트 구현 — Google 로그인 버튼, 로딩/에러 상태, callbackUrl 처리
  - 수정 파일: `apps/admin/src/features/auth/components/LoginForm.tsx`
- [x] 5.3 LoginErrorBanner 컴포넌트 구현 — 비인가 계정, 취소, 서버 오류 각 사유 메시지
  - 수정 파일: `apps/admin/src/features/auth/components/LoginErrorBanner.tsx`
- [x] 5.4 로그인 화면 레이아웃 스타일 구현 — 좌 다크 패널(55%) + 우 라이트 패널(45%), 디자인 토큰 적용
  - 수정 파일: `apps/admin/src/app/(public)/login/page.tsx`

## 6. apps/admin — Auth feature 레이어

- [x] 6.1 auth fetcher 함수 구현 (sign-in 시작, sign-out, callbackUrl 처리)
  - 수정 파일: `apps/admin/src/features/auth/api.ts`
- [x] 6.2 세션 Query Key Factory 및 useSession 래퍼 query 구현
  - 수정 파일: `apps/admin/src/features/auth/queries.ts`
- [x] 6.3 auth 도메인 타입 정의
  - 수정 파일: `apps/admin/src/features/auth/types.ts`

## 7. apps/admin — Header 사용자 정보 연결

- [x] 7.1 Header에 세션 사용자 이름·이메일 표시 및 로그아웃 버튼 추가
  - 수정 파일: `apps/admin/src/components/layout/Header.tsx`
