# 폴더 규칙

## apps/admin 구조

```
apps/admin/src/
├── app/                     # 라우팅 파일만 (page/layout/route/proxy)
│   ├── (app)/               # Shell 라우트 그룹 — 인증 필요
│   ├── (public)/            # 공개 라우트 그룹 — Shell 미적용
│   └── api/[...proxy]/      # BFF Route Handler
├── components/              # 도메인 비종속 공통 컴포넌트
│   ├── ui/                  # shadcn — kebab-case
│   └── layout/              # 헤더/사이드바 — PascalCase
├── features/<domain>/       # 기능별 슬라이스
│   ├── api.ts
│   ├── queries.ts
│   ├── components/
│   ├── store.ts
│   └── types.ts
└── lib/                     # 도메인 비종속 공용 유틸
    ├── api.ts               # 클라이언트 fetcher
    ├── api-server.ts        # 서버 fetcher
    ├── navigation/
    └── query-keys/
```

## 파일명 casing

| 유형 | casing |
|------|--------|
| React 컴포넌트 `.tsx` | PascalCase |
| shadcn `components/ui/*` | kebab-case |
| 유틸·서버·타입 `.ts` | kebab-case |
| 테스트 | 대상 이름 + `.test.tsx/.test.ts` |
| Next.js 라우팅 | Next.js 규약 (소문자) |

## Export

- `page.tsx`, `layout.tsx`: default export
- 그 외 모든 파일: named export

## 규칙

- `app/` 하위에는 라우팅 파일만
- `features/<domain>/`은 자족적 — 다른 feature import 금지
- `components/`는 도메인 비종속만 — 특정 도메인 컴포넌트는 `features/<domain>/components/`
- `middleware.ts` 금지 → `proxy.ts`

## apps/api 구조

```
src/
├── <domain>/   # 도메인 모듈 (controller/service/dto)
├── auth/       # Guard, Strategy
├── rbac/       # Role/Permission/Menu, @RequirePermission 데코레이터
└── prisma/     # Prisma module, client 싱글톤
```
