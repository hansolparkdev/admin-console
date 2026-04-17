# 금지 패턴

## 보안
- `localStorage` / `sessionStorage`에 토큰/세션 저장 금지
- `NEXT_PUBLIC_API_URL` 등 백엔드 URL 브라우저 노출 금지
- RBAC 체크 프론트 단독 금지 — 백엔드 Guard + 프론트 UI 양쪽 필수
- 비즈니스 로직(MES, VDI 등) 본체 커밋 금지
- `docs/legacy/**` 수정 금지

## 상태 관리
- 문자열 리터럴 Query Key 금지
- `setState` + `await` 낙관적 업데이트 금지
- `useEffect` fetch-on-render 금지
- Server Component에서 `lib/api.ts` 호출 금지

## 라우팅 / 파일 배치
- `app/` 하위에 라우팅 파일 외 코드 배치 금지
- `middleware.ts` 사용 금지
- 라우트 그룹명 `(app)` / `(public)` 외 사용 금지
- `app/**/page.tsx` / `app/**/layout.tsx` 테스트 누락 금지

## 타입 / 코드 품질
- `any` 남발, `@ts-ignore` / `@ts-expect-error` without reason 금지
- 파일명 casing 위반 금지
- `page.tsx` / `layout.tsx` 외 default export 금지
- Prisma client 매 요청마다 `new` 금지

## UI/UX
- 로딩 / 에러 / 빈 상태 미처리 금지

## 개발 프로세스
- `--no-verify` 우회 금지
- E2E `CI=1` / `--headless` 로컬 실행 금지
- 리뷰어 런타임 기동 없이 PASS 금지
