# Admin Console

> 범용 어드민 콘솔 기반 (core + 비즈니스 모듈 확장형).
> 파생 프로젝트: `admin-mes` / `admin-vdi` 등.

## 시작하기

### 요구사항

- **Node**: 22 LTS (`.nvmrc` 기준)
- **pnpm**: Corepack 경유 자동 활성 (`packageManager` 필드 고정)
- **OS**: macOS 14+, Ubuntu 22.04+, Windows 11 WSL2 (네이티브 Windows 비공식)

### 설치

```bash
# Node 버전 맞추기 (nvm 기준)
nvm install 22 && nvm use

# pnpm 활성화
corepack enable

# 의존성 설치
pnpm install
```

### 검증

```bash
pnpm lint        # exit 0
```

## 현재 상태

- **Phase**: 0 (기초 세팅 진행 중)
- **Slice 01**: bootstrap-and-harness ✓ 완료
- 자세한 로드맵: [`docs/plans/phase-0-foundation/plan.md`](docs/plans/phase-0-foundation/plan.md)

## 문서

- [`CLAUDE.md`](CLAUDE.md) — 프로젝트 개요·스택·폴더 규칙
- [`docs/plans/phase-0-foundation/plan.md`](docs/plans/phase-0-foundation/plan.md) — Phase 0 기획
- [`docs/legacy/NEW-PROJECT-SPEC.md`](docs/legacy/NEW-PROJECT-SPEC.md) — 전체 설계 명세 (레거시 코드네임 `axis` = `admin-console`)
- [`docs/DESIGN.md`](docs/DESIGN.md) — 디자인 토큰
- [`docs/harness.md`](docs/harness.md) — Claude Code 훅 설계

## 라이선스

Apache-2.0 (Slice 08에서 LICENSE 파일 추가 예정)
