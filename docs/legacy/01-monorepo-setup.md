# 01. 모노레포 초기 셋업

## 개요

Next.js(프론트엔드) + NestJS(백엔드)를 하나의 저장소에서 관리하는 모노레포를 구성한다.
패키지 매니저는 pnpm, 빌드 오케스트레이션은 Turborepo를 사용한다.

## 사용 도구

| 도구 | 버전 | 역할 |
|------|------|------|
| Node.js | v24.x | 런타임 |
| pnpm | 10.x | 패키지 매니저 (workspace 지원) |
| Turborepo | 2.x | 모노레포 빌드 오케스트레이션 |
| TypeScript | 5.x~6.x | 타입 시스템 |

## 초기화 순서

### 1. git + pnpm 초기화

```bash
git init
pnpm init
```

- `pnpm init`은 기본 `package.json`을 생성한다.

### 2. pnpm-workspace.yaml 생성

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**왜 필요한가?**
- 이 파일이 있어야 pnpm이 이 프로젝트를 **모노레포(워크스페이스)**로 인식한다.
- `apps/*` 아래의 각 폴더, `packages/*` 아래의 각 폴더를 **독립적인 패키지**로 취급한다.
- 이 파일이 없으면 `pnpm add -w` (루트 설치)가 동작하지 않는다.
- 패키지 간 `"workspace:*"` 프로토콜로 서로 참조하는 것도 이 파일이 있어야 가능하다.

**주의: 이 파일을 먼저 생성한 후에 `pnpm add -w`를 실행해야 한다.**

### 3. Turborepo + TypeScript 설치

```bash
pnpm add -D turbo typescript -w
```

- `-D`: devDependencies로 설치
- `-w`: 루트 워크스페이스에 설치 (각 앱이 아닌 루트)
- turbo와 typescript는 모든 앱이 공통으로 쓰는 도구이므로 루트에 설치한다.

### 4. turbo.json 생성

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**왜 필요한가?**
- Turborepo의 핵심 설정 파일. 빌드/실행 파이프라인을 정의한다.
- 이 파일이 없으면 `turbo run dev`를 실행할 수 없다.

**각 설정의 의미:**

| 설정 | 의미 |
|------|------|
| `"dependsOn": ["^build"]` | `^`는 "내가 의존하는 패키지를 먼저 빌드해라"는 의미. 예: admin이 types를 참조하면 types가 먼저 빌드된다. |
| `"outputs"` | 빌드 결과물 경로. Turborepo가 이걸 캐싱해서 변경 없으면 재빌드를 건너뛴다. |
| `"cache": false` | dev 서버는 매번 새로 실행해야 하므로 캐싱하지 않는다. |
| `"persistent": true` | dev 서버처럼 계속 실행 상태를 유지하는 태스크임을 표시한다. |

### 5. .npmrc 생성

```
auto-install-peers=true
```

**왜 필요한가?**
- pnpm은 기본적으로 peer dependency를 자동 설치하지 않고 경고만 출력한다.
- 예: Next.js가 `"peerDependencies": { "react": "^19" }`를 선언해도 pnpm은 직접 설치하라고 경고한다.
- 이 설정을 켜면 peer dependency를 자동 설치하여 경고를 방지한다.

### 6. 루트 package.json 정리

`pnpm init`이 생성한 기본 형태에서 실무 형태로 수정한다.

**Before (pnpm init 기본):**
```json
{
  "name": "monorepo-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

**After (실무):**
```json
{
  "name": "monorepo-project",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.9.6",
    "typescript": "^6.0.2"
  }
}
```

**변경 이유:**

| 항목 | 이유 |
|------|------|
| `"private": true` 추가 | **필수.** 루트 패키지가 npm에 실수로 배포되는 것을 방지 |
| `main`, `keywords`, `author`, `license` 제거 | 루트는 배포하는 패키지가 아니므로 불필요 |
| `packageManager` 추가 | 다른 개발자가 npm/yarn으로 실수 설치하는 것 방지 (Corepack 연동) |
| `scripts`에 turbo 명령 추가 | `pnpm dev`로 모든 앱을 동시에 실행, `pnpm build`로 전체 빌드 |

### 7. Admin 앱 생성

```bash
mkdir -p apps
cd apps
pnpm dlx create-next-app@latest admin --typescript --app --src-dir --use-pnpm
```

- `pnpm dlx`: npx와 동일. 패키지를 설치하지 않고 일회성으로 실행한다.
- `create-next-app`이 `package.json`, `tsconfig.json`, `next.config.ts` 등을 자동 생성한다.
- `--app`: App Router 사용 (Pages Router 대신)
- `--src-dir`: 소스코드를 `src/` 하위에 배치

## 최종 디렉토리 구조

```
monorepo-project/
├── .git/
├── .npmrc                    # pnpm 옵션 (peer dependency 자동 설치)
├── package.json              # 루트 - 공통 도구 + turbo 스크립트
├── pnpm-lock.yaml            # 의존성 잠금 파일 (자동 생성)
├── pnpm-workspace.yaml       # 워크스페이스 범위 선언
├── turbo.json                # Turborepo 빌드 파이프라인
├── node_modules/
└── apps/
    └── admin/                # Next.js 어드민 앱 (create-next-app 생성)
        ├── package.json
        ├── tsconfig.json
        ├── next.config.ts
        └── src/app/
```

## 핵심 정리

1. **pnpm-workspace.yaml을 가장 먼저 만든다** — 이게 없으면 `-w` 옵션이 안 된다.
2. **루트 package.json에 `"private": true`는 필수** — 실수 배포 방지.
3. **turbo, typescript는 루트에 설치** — 모든 앱이 공통으로 쓰는 도구.
4. **앱은 `create-next-app` 등 CLI로 생성** — package.json, tsconfig 등 수동 작성 불필요.
