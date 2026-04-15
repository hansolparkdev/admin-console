# 02. 공유 패키지 생성 및 Admin 연결

## 개요

프론트엔드와 백엔드가 같은 타입, 같은 UI 컴포넌트를 쓸 수 있도록 공유 패키지를 만들고,
admin 앱에서 실제로 연결하여 사용하는 과정.

## 왜 공유 패키지가 필요한가?

프론트와 백엔드가 같은 데이터를 다루는데, 타입을 각각 따로 정의하면:
- 백엔드에서 필드명을 바꿔도 프론트에서 **컴파일 에러가 안 남**
- 앱이 늘어날수록 같은 타입을 **복붙하며 관리**해야 함

공유 패키지로 한 곳에서 관리하면, 타입이 바뀌는 순간 참조하는 모든 앱에서 **빌드 에러가 나서 바로 잡을 수 있다.**

| 패키지 | 역할 | 누가 쓰나 |
|--------|------|-----------|
| `@monorepo/types` | 공통 타입 (User, ApiResponse 등) | 프론트 + 백엔드 모두 |
| `@monorepo/ui` | 공통 UI 컴포넌트 (Button 등) | 프론트 앱들끼리 |

---

## tsconfig.base.json (루트)

각 패키지의 tsconfig가 `extends`로 상속하는 공통 설정.
한 번 만들면 거의 안 건드린다.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

### module과 moduleResolution은 세트

| module | moduleResolution | 용도 |
|--------|-----------------|------|
| `nodenext` | `nodenext` | Node.js 직접 실행. import에 확장자 필수. |
| `esnext` | `bundler` | 번들러가 처리 (Next.js, Vite 등). 확장자 생략 가능. |

Next.js는 번들러(Turbopack)가 모듈을 처리하므로 `esnext` + `bundler` 조합을 사용한다.
`nodenext`를 쓰면 `export { Button } from "./Button"` 같은 코드에서 에러가 난다.

---

## packages/types 생성

### 명령어

```bash
mkdir -p packages/types/src
cd packages/types
pnpm init
```

### package.json (수정)

```json
{
  "name": "@monorepo/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "lint": "tsc --noEmit"
  }
}
```

**핵심 설정:**
- `"name": "@monorepo/types"` — `@monorepo/` 스코프를 붙여서 다른 앱에서 `import { User } from "@monorepo/types"`로 사용. npm의 기존 패키지와 이름 충돌 방지.
- `"main": "./src/index.ts"` — **내부 패키지 패턴.** 빌드된 `dist/`가 아닌 소스를 직접 가리킨다. Next.js나 NestJS가 알아서 트랜스파일하므로 이 패키지를 따로 빌드할 필요 없음.
- `"private": true` — npm에 실수로 배포 방지.

### tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- `"extends"` — 루트의 공통 설정을 상속. strict, target 등을 반복 작성 안 해도 됨.

### src/index.ts

```ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}
```

---

## packages/ui 생성

### 명령어

```bash
mkdir -p packages/ui/src
cd packages/ui
pnpm init
```

### package.json (수정)

```json
{
  "name": "@monorepo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/types": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "react": "19.2.4"
  }
}
```

**핵심 설정:**
- `"@monorepo/types": "workspace:*"` — **워크스페이스 프로토콜.** npm이 아닌 모노레포 안의 `@monorepo/types`를 참조하겠다는 뜻. `pnpm install` 시 심링크로 연결됨.
- `"peerDependencies": { "react" }` — "나는 React를 쓰지만, 설치는 나를 쓰는 앱(admin)에서 해라." 버전 충돌 방지.
- `"devDependencies": { "react", "@types/react" }` — 에디터에서 JSX 타입 에러 안 나게 하려면 개발용으로 설치 필요. `pnpm add -D react @types/react --filter @monorepo/ui` 명령으로 추가.

### tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- `"jsx": "react-jsx"` — JSX 문법(`<button>` 등)을 사용하려면 필요. React 17+ 방식으로 `import React` 안 써도 됨.

### src/index.ts (배럴 파일)

```ts
export { Button } from "./Button";
```

배럴 파일이란? 외부에서 `import { Button } from "@monorepo/ui"` 한 줄로 쓸 수 있게 해주는 진입점.
이게 없으면 `import { Button } from "@monorepo/ui/src/Button"` 처럼 경로를 직접 써야 한다.

### src/Button.tsx

```tsx
interface ButtonProps {
  label: string;
  onClick?: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

---

## 의존성 설치 (심링크 연결)

```bash
cd /Users/parkhansol/work/devel/workspace/monorepo-project
pnpm install
```

package.json에 `"workspace:*"`를 적는 건 **주문서 작성.**
`pnpm install`은 **실제 배달** — 심링크를 생성해서 패키지 간 참조를 연결해준다.

---

## Admin 앱에서 공유 패키지 연결

### 1. 의존성 추가

```bash
pnpm add "@monorepo/types@workspace:*" "@monorepo/ui@workspace:*" --filter admin
```

**주의사항:**
- `workspace:*` 없이 `pnpm add @monorepo/types`만 치면 npm 레지스트리에서 찾으려고 해서 404 에러가 난다.
- `*`를 따옴표로 감싸야 한다. zsh에서 `*`는 "모든 파일"을 뜻하는 특수문자(와일드카드)이므로, 따옴표 없으면 파일 찾기로 해석되어 에러.
- `--filter admin` — admin 앱에만 설치.

### 2. next.config.ts 수정

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monorepo/ui"],
};

export default nextConfig;
```

**왜?** `@monorepo/ui`는 빌드 안 된 `.tsx` 소스 파일을 직접 제공한다.
Next.js에게 "이 패키지는 네가 직접 컴파일해라"라고 알려주는 설정.
이게 없으면 `.tsx` 파일을 이해 못해서 빌드 에러가 난다.

### 3. page.tsx에서 사용

```tsx
import { Button } from "@monorepo/ui";
import type { User } from "@monorepo/types";

export default function Home() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <Button label="클릭" />
    </main>
  );
}
```

**Next.js의 page.tsx 규칙:** 반드시 컴포넌트를 `export default`해야 한다.
import만 있고 컴포넌트가 없으면 "The default export is not a React Component" 에러.

### 4. 실행 확인

```bash
pnpm dev --filter admin
```

http://localhost:3000 접속하여 "Admin Dashboard" + 버튼 렌더링 확인.

---

## 트러블슈팅

### apps/admin/pnpm-workspace.yaml 중복

`create-next-app`이 admin 안에 `pnpm-workspace.yaml`을 자동 생성하는 경우가 있다.
루트에 이미 있으므로 앱 안의 것은 삭제한다:

```bash
rm apps/admin/pnpm-workspace.yaml
```

없으면 Next.js가 "lockfile이 2개 있다"는 경고를 출력한다.

---

## 현재 최종 디렉토리 구조

```
monorepo-project/
├── .git/
├── .npmrc
├── package.json              # 루트 - turbo 스크립트 + 공통 도구
├── pnpm-lock.yaml
├── pnpm-workspace.yaml       # 워크스페이스 범위 선언
├── turbo.json                # Turborepo 빌드 파이프라인
├── tsconfig.base.json        # 공통 TS 설정 (esnext + bundler)
├── node_modules/
├── apps/
│   └── admin/                # Next.js 어드민 앱
│       ├── package.json      # @monorepo/types, @monorepo/ui 참조
│       ├── next.config.ts    # transpilePackages 설정
│       ├── tsconfig.json
│       └── src/app/
│           └── page.tsx      # Button 컴포넌트 + User 타입 사용
└── packages/
    ├── types/                # 공유 타입 패키지
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/index.ts      # User, ApiResponse 타입
    └── ui/                   # 공유 UI 컴포넌트 패키지
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts      # 배럴 파일
            └── Button.tsx    # Button 컴포넌트
```

## 핵심 3줄 요약

1. `workspace:*` — 모노레포 안의 다른 패키지를 참조하는 문법. 따옴표로 감싸서 사용.
2. `"main": "./src/index.ts"` — 내부 패키지는 빌드 없이 소스 직접 참조.
3. `transpilePackages` — Next.js에게 "이 패키지의 소스를 직접 컴파일해라"고 알려주는 설정.