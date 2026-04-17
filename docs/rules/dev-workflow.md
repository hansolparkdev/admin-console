# /dev 워크플로우 규율

## 서버 기동 (전 에이전트 공통)

- 포트(3000, 3001) 점유 중이면 기존 프로세스 재사용 — 새로 띄우기 금지
- 점유 확인: `lsof -ti:<port>`
- 점유 없을 때만 `pnpm --filter <pkg> dev` 백그라운드 기동 허용
- 기동 즉시 PID 저장, 작업 완료 후 `kill <PID>`
- `EADDRINUSE` 시 즉시 유저 에스컬레이션

## 개발 에이전트 (Step 2)

착수 전 필수 읽기:
- `docs/rules/forbidden-patterns.md`
- `docs/rules/folder-conventions.md`
- `apps/api/prisma/schema.prisma` (백엔드 코드 작성 시)

Prisma 규율:
- 서비스 메서드 작성 전 `schema.prisma`에서 필드명·relation 확인
- `orderBy`, `include`, `where`에 존재하지 않는 필드 사용 금지

완료 체크리스트:
- [ ] `app/**/page.tsx` / `app/**/layout.tsx` 전부 테스트 존재
- [ ] `CI=1`, `--headless`, `process.env.CI=true` 미사용
- [ ] 금지 패턴 위반 0

## 리뷰어 (Step 3)

- 정적 리뷰만으로 PASS 금지 — 런타임 기동 증거 필수
- frontend: curl로 주요 경로 응답 확인
- backend: 주요 엔드포인트 ping
- "런타임 에러 0건" 체크 필수

## 테스터 (Step 4)

- E2E 첫 실행은 headed — `CI=1` 금지
- headed 실행 시 "헤드된 브라우저로 실행했습니다. 육안 확인 부탁드립니다" 알림
- Playwright 미설치 시 BLOCKED 판정 — 자체 우회 금지
- Google/외부 실서버 호출 금지 — MSW/fixture mock 사용
