# 스택 특화 규율

> 범용 워크플로우 규율은 `dev-workflow.md`. 이 파일은 스택별 추가 규율.
> `/init` 실행 시 프로젝트 스택에 맞는 항목만 활성화.

## Prisma (NestJS + PostgreSQL)

개발 에이전트 착수 전 필수:
- `apps/api/prisma/schema.prisma` Read

규율:
- 서비스 메서드 작성 전 `schema.prisma`에서 필드명·relation 확인
- `orderBy`, `include`, `where`에 존재하지 않는 필드 사용 금지
- Prisma client 매 요청 `new` 금지 → 싱글톤

## Next.js App Router

완료 체크리스트 추가:
- [ ] `app/**/page.tsx` / `app/**/layout.tsx` 전부 테스트 존재
- [ ] `CI=1`, `--headless`, `process.env.CI=true` 미사용
- [ ] Server Component에서 `lib/api.ts` 호출 없음 → `lib/api-server.ts` 사용
- [ ] `app/` 하위 라우팅 파일 외 코드 없음

## React (TanStack Query)

- 문자열 리터럴 Query Key 금지 → Query Key Factory
- `setState+await` 낙관적 업데이트 금지 → `queryClient.setQueryData`
- fetch-on-render(useEffect fetch) 금지 → Server prefetch + HydrationBoundary
