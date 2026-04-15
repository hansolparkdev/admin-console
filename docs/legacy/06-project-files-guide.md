# 06. 프로젝트 파일 가이드

## 루트

```
monorepo-project/
├── package.json           # 루트 워크스페이스 설정, turbo 스크립트, 공통 devDependencies
├── pnpm-workspace.yaml    # 워크스페이스 범위 선언 (apps/*, packages/*)
├── pnpm-lock.yaml         # 전체 의존성 잠금 파일. 모든 패키지의 정확한 버전이 기록됨. 직접 수정 X.
├── turbo.json             # Turborepo 빌드 파이프라인 (빌드 순서, 캐싱 설정)
├── tsconfig.base.json     # 공통 TypeScript 설정. 각 앱/패키지가 extends로 상속.
├── .npmrc                 # pnpm 옵션 (auto-install-peers 등)
├── .gitignore             # git에서 제외할 파일/폴더
├── docker-compose.yml     # Docker 서비스 정의 (PostgreSQL 등)
└── node_modules/          # 의존성 설치 폴더. git에 올리지 않음.
```

---

## apps/admin (Next.js)

```
apps/admin/
├── package.json           # admin 앱의 의존성과 스크립트
├── next.config.ts         # Next.js 설정
├── tsconfig.json          # TypeScript 설정 (Next.js가 자동 관리)
├── eslint.config.mjs      # ESLint 설정 (코드 품질 검사)
├── postcss.config.mjs     # PostCSS 설정 (Tailwind CSS 처리)
├── next-env.d.ts          # Next.js 타입 선언 (자동 생성, 수정 X)
├── public/                # 정적 파일 (이미지, 폰트 등)
├── src/                   # 소스코드
│   └── app/               # App Router 디렉토리
├── AGENTS.md              # AI 도구용 가이드 (create-next-app 자동 생성, 삭제 가능)
├── CLAUDE.md              # AI 도구용 가이드 (create-next-app 자동 생성, 삭제 가능)
└── README.md              # 프로젝트 설명
```

### 파일별 상세 설명

#### package.json
앱의 의존성 목록과 실행 스크립트.

```json
"scripts": {
  "dev": "next dev",       // 개발 서버 실행 (핫 리로드)
  "build": "next build",   // 프로덕션 빌드
  "start": "next start",   // 빌드된 앱 실행
  "lint": "eslint"         // 코드 검사
}
```

#### next.config.ts
Next.js의 동작을 커스터마이징하는 설정 파일.

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@monorepo/ui"],  // 워크스페이스 패키지의 .ts 파일을 직접 트랜스파일
};
```

자주 쓰는 설정:
- `transpilePackages` — 모노레포 내부 패키지 트랜스파일 (지금 사용 중)
- `images.domains` — 외부 이미지 URL 허용
- `redirects()` — URL 리다이렉트 규칙
- `rewrites()` — URL 프록시 (API 프록시 등)
- `env` — 환경변수 주입

#### tsconfig.json
TypeScript 컴파일러 설정. Next.js가 `next dev` 실행 시 자동으로 생성/관리함.
직접 수정할 일은 거의 없지만, path alias(`@/` 같은 경로 단축) 추가할 때 수정.

#### eslint.config.mjs
코드 품질 검사 규칙. `pnpm lint` 실행 시 이 설정을 기준으로 검사.

역할:
- 사용하지 않는 변수 경고
- import 순서 정리
- React Hook 규칙 위반 감지
- Next.js 권장 패턴 강제

직접 수정할 일: 규칙을 끄거나 추가할 때. 초기에는 건드릴 필요 없음.

#### postcss.config.mjs
CSS를 변환하는 도구(PostCSS) 설정. Tailwind CSS를 사용하면 여기에 Tailwind 플러그인이 등록됨.
Tailwind를 안 쓰면 이 파일도 필요 없음.

#### next-env.d.ts
Next.js가 자동 생성하는 TypeScript 타입 선언 파일.
**절대 수정하지 말 것.** Next.js가 알아서 관리.

#### public/
정적 파일 폴더. 여기에 넣으면 `/` 경로로 직접 접근 가능.
예: `public/logo.png` → `http://localhost:3000/logo.png`

#### src/app/ (App Router)
Next.js의 핵심. 파일명이 곧 기능.

```
src/app/
├── layout.tsx      # 모든 페이지를 감싸는 레이아웃 (HTML 뼈대)
├── page.tsx        # / 경로의 페이지
├── loading.tsx     # 로딩 중 표시할 UI (있으면 자동 적용)
├── error.tsx       # 에러 발생 시 표시할 UI (있으면 자동 적용)
├── not-found.tsx   # 404 페이지
└── post/
    ├── page.tsx    # /post 경로
    └── [id]/
        └── page.tsx  # /post/1, /post/2 등 동적 경로
```

이 파일 컨벤션이 Next.js App Router의 핵심. 파일을 만들기만 하면 라우팅이 자동으로 됨.

---

## apps/api (NestJS)

```
apps/api/
├── package.json           # api 앱의 의존성과 스크립트
├── tsconfig.json          # TypeScript 설정
├── tsconfig.build.json    # 빌드 전용 TypeScript 설정
├── nest-cli.json          # NestJS CLI 설정
├── eslint.config.mjs      # ESLint 설정
├── prisma.config.ts       # Prisma 설정 (DB URL 등)
├── prisma/                # Prisma 스키마 + 마이그레이션
│   ├── schema.prisma
│   └── migrations/
├── src/                   # 소스코드
├── dist/                  # 빌드 결과물 (nest build 후 생성)
├── test/                  # e2e 테스트
└── README.md
```

### 파일별 상세 설명

#### package.json

```json
"scripts": {
  "dev": "nest start --watch",       // 개발 서버 (파일 변경 시 자동 재시작)
  "build": "nest build",             // 프로덕션 빌드 (dist/ 폴더에 JS 생성)
  "start": "nest start",             // 일반 실행
  "start:prod": "node dist/main",    // 빌드된 JS로 실행 (프로덕션)
}
```

#### tsconfig.json
TypeScript 설정. NestJS는 Next.js와 달리 직접 관리해야 함.

주요 설정:
- `emitDecoratorMetadata: true` — NestJS 데코레이터(@Controller 등)가 동작하려면 필수
- `experimentalDecorators: true` — 위와 세트

#### tsconfig.build.json
빌드할 때만 쓰는 설정. 테스트 파일(`*.spec.ts`)을 빌드에서 제외.

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

#### nest-cli.json
NestJS CLI의 설정 파일.

```json
{
  "sourceRoot": "src",           // 소스코드 위치
  "compilerOptions": {
    "tsConfigPath": "tsconfig.build.json"  // 빌드할 때 이 tsconfig 사용
  }
}
```

`nest generate`, `nest build` 등 CLI 명령이 이 설정을 참조.

#### eslint.config.mjs
admin과 동일한 역할. NestJS 프로젝트의 코드 품질 검사.

#### prisma.config.ts
Prisma 7에서 추가된 설정 파일. DB 접속 URL, 스키마 위치, 마이그레이션 경로를 정의.

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",      // 스키마 파일 위치
  migrations: { path: "prisma/migrations" },  // 마이그레이션 폴더
  datasource: { url: process.env["DATABASE_URL"] },  // DB 접속 URL
});
```

이전 버전에서는 schema.prisma 안에 다 넣었지만, Prisma 7부터 분리됨.

#### dist/
`nest build` 실행 후 생성되는 폴더. TypeScript → JavaScript 변환 결과물.
프로덕션 서버에서는 `node dist/main.js`로 실행. git에 올리지 않음.

#### test/
e2e(End-to-End) 테스트 폴더. API를 실제로 호출해서 응답을 검증하는 테스트.

---

## 수정 빈도별 정리

### 자주 수정하는 파일
| 파일 | 언제 |
|------|------|
| `src/` 안의 코드 | 매일 |
| `package.json` | 의존성 추가/제거할 때 |
| `schema.prisma` | DB 스키마 변경할 때 |
| `next.config.ts` | 새로운 Next.js 기능 설정할 때 |

### 초기 한 번만 설정하고 거의 안 건드리는 파일
| 파일 | 비고 |
|------|------|
| `tsconfig.json` / `tsconfig.base.json` | path alias 추가할 때 정도 |
| `eslint.config.mjs` | 규칙 추가/제거할 때 정도 |
| `turbo.json` | 새로운 태스크 추가할 때 정도 |
| `nest-cli.json` | 거의 안 건드림 |
| `prisma.config.ts` | 거의 안 건드림 |
| `docker-compose.yml` | 서비스 추가할 때 |

### 절대 수정하면 안 되는 파일
| 파일 | 이유 |
|------|------|
| `next-env.d.ts` | Next.js가 자동 관리 |
| `pnpm-lock.yaml` | pnpm이 자동 관리 |
| `prisma/migrations/` 안의 SQL | 이미 적용된 마이그레이션은 수정하면 꼬임 |
