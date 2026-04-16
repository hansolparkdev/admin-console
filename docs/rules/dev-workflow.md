# /dev 워크플로우 규율 (Developer / Reviewer / Tester)

`/dev` 스킬은 단일 슬라이스를 개발→리뷰→테스트→아카이브까지 처리한다. 각 단계 에이전트가 지켜야 할 규율이다. 어기면 해당 Step은 FAIL 처리하고 changes/ 보존 상태로 유저 보고.

## 개발 에이전트 (Step 2)

완료 리포트에 다음 체크리스트를 스스로 검증하고 결과를 명시한다.

- [ ] `pnpm --filter <pkg> dev` 기동 시 **deprecation warning 0** + **runtime error 0**
- [ ] 모든 `app/**/page.tsx` / `app/**/layout.tsx` 파일이 테스트에 등장 (RTL 또는 E2E)
- [ ] 페이지 컴포넌트 테스트 ↔ 시나리오(AUTH-N 등) 매핑 테이블 제공
- [ ] TDD 태스크는 "실패 테스트 로그 → 구현 커밋 → 그린 로그" 증거
- [ ] Next.js / Auth.js / Prisma 등 주요 의존의 현재 버전 deprecation 이슈 확인
- [ ] `CI=1`, `--headless`, `process.env.CI=true` 같은 E2E 우회 플래그 **미사용**
- [ ] 금지 패턴 섹션 위반 0

위 중 하나라도 실패면 "완료"가 아닌 **블로커**로 보고.

## 리뷰어 (Step 3)

- 정적 리뷰만으로 PASS 금지. **반드시 런타임 기동 증거 제시**
  - frontend: `pnpm --filter <pkg> dev` 백그라운드 기동 → `/`, `/login` 등 주요 경로 curl → 응답 + 로그 수집
  - backend: `pnpm --filter <pkg> start:dev` + 엔드포인트 ping
- 체크 항목에 "deprecation warning 0건" / "런타임 에러 0건" / "missing secret 경고 0건" 포함
- 런타임 검증 로그 없이 PASS 시도 시 자동 거부

## 테스터 (Step 4)

- E2E **첫 실행은 반드시 headed**. `CI=1` 환경변수 설정 금지
- 시각 확인 필요하면 "헤드된 브라우저로 실행했습니다. 육안 확인 부탁드립니다" 사용자 알림 필수
- Playwright 미설치 시 BLOCKED 판정. "Playwright 설치 작업 필요" 에스컬레이션 — 자체 우회 금지
- Google/외부 실서버 호출이 필요한 시나리오는 MSW/fixture 기반 mock. 실서버 호출 금지
