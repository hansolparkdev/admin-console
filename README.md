# Admin Console

[![CI](https://github.com/hansolparkdev/admin-console/actions/workflows/ci.yml/badge.svg)](https://github.com/hansolparkdev/admin-console/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> 범용 어드민 콘솔 기반 (core + 비즈니스 모듈 확장형).
> 파생 프로젝트: `admin-mes` / `admin-vdi` 등.

## 시작하기

### 요구사항

- **Node**: 22 LTS (`.nvmrc` 기준)
- **pnpm**: Corepack 경유 자동 활성 (`packageManager` 필드 고정)
- **Docker**: Postgres/Redis 로컬 기동용 (선택 — `SKIP_INFRA=1`로 스킵 가능)

### 지원 OS

| OS                                | 등급   | 조건                   |
| --------------------------------- | ------ | ---------------------- |
| macOS 14+ (Apple Silicon / Intel) | 1급    | `corepack enable` 선행 |
| Ubuntu 22.04+ / 동급 Linux        | 1급    | `corepack enable` 선행 |
| Windows 11 + WSL2 (Ubuntu 22.04)  | 1급    | WSL 내부에서 실행      |
| Windows 11 네이티브               | 비공식 | 미지원                 |

### 설치

```bash
# Node 버전 맞추기 (nvm 기준)
nvm install 22 && nvm use

# pnpm 활성화
corepack enable

# 의존성 설치
pnpm install
```

### 개발 명령

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm test        # Vitest 단위/통합
pnpm test:e2e    # Playwright E2E
pnpm build       # 전체 빌드 (Phase 1+)
pnpm dev         # 개발 서버 (Phase 1+)
```

### 로컬 인프라

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
```

Postgres(5432) + Redis(6379)가 `.env`의 자격증명으로 기동. 60초 내 `healthy` 도달.

## 템플릿으로 사용

### 1) GitHub "Use this template"

저장소 페이지의 초록색 "Use this template" 버튼 → 새 레포 생성.

### 2) degit으로 복제

```bash
pnpm dlx degit hansolparkdev/admin-console my-admin
cd my-admin
corepack enable && pnpm install
```

복제 후 교체할 것:

- `LICENSE`의 Copyright
- `.github/CODEOWNERS`의 @hansolparkdev
- `package.json` name / repository
- README 제목·설명

## 구조

```
apps/                Phase 1: admin (Next.js), Phase 2: api (NestJS) — 현재 없음
packages/
  config-ts/         공유 TS 프리셋 (base/node/nextjs)
  config-eslint/     공유 ESLint 규칙
  config-env/        zod 환경변수 스키마 (Phase 1/2에서 채움)
  testing/           Vitest/Playwright 공용 설정 팩토리
docker/              postgres + redis
.github/workflows/   CI (install/lint/typecheck/test/infra/template-smoke)
docs/
  plans/             Phase별 기획서
  legacy/            이전 spec (레거시 코드네임 "axis" = admin-console)
  harness.md         Claude Code 훅 설계
  DESIGN.md          디자인 토큰
```

## 문서

- [`CLAUDE.md`](CLAUDE.md) — 프로젝트 개요·스택·폴더 규칙
- [`docs/plans/phase-0-foundation/plan.md`](docs/plans/phase-0-foundation/plan.md) — Phase 0 기획 / DoD
- [`docs/legacy/NEW-PROJECT-SPEC.md`](docs/legacy/NEW-PROJECT-SPEC.md) — 전체 설계 명세
- [`docs/DESIGN.md`](docs/DESIGN.md) — 디자인 토큰
- [`docs/harness.md`](docs/harness.md) — 훅 설계
- [`SECURITY.md`](SECURITY.md) — 보안 제보

## 현재 상태

- **Phase 0**: Slice 01~08 완료 ✓
- **Phase 1**: 디자인 시스템 (`packages/ui` + Storybook) — 예정
- **Phase 2**: NestJS API + RBAC — 예정

## 라이선스

[Apache-2.0](LICENSE)
