# 03. NestJS API 앱 생성 및 공유 타입 연결

## 개요

NestJS 백엔드 API 서버를 모노레포에 추가하고, `@monorepo/types`의 공유 타입을 사용하여
프론트엔드와 백엔드가 같은 타입으로 통신하는 구조를 완성한다.

---

## NestJS CLI로 앱 생성

```bash
cd /Users/parkhansol/work/devel/workspace/monorepo-project/apps
pnpm dlx @nestjs/cli new api --skip-git --package-manager pnpm
```

| 옵션 | 의미 |
|------|------|
| `pnpm dlx` | npx와 동일. 패키지를 설치하지 않고 일회성으로 실행 |
| `--skip-git` | 루트에 이미 git이 있으니 중복 초기화 방지 |
| `--package-manager pnpm` | pnpm 사용 |

### CLI가 자동 생성하는 것들

```
apps/api/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── src/
    ├── main.ts              # 서버 진입점
    ├── app.module.ts        # 루트 모듈
    ├── app.controller.ts    # 컨트롤러
    ├── app.service.ts       # 서비스
    └── app.controller.spec.ts  # 테스트
```

---

## 공유 타입 패키지 연결

```bash
cd /Users/parkhansol/work/devel/workspace/monorepo-project
pnpm add "@monorepo/types@workspace:*" --filter api
```

실행 후 `apps/api/package.json`의 dependencies에 자동 추가됨:

```json
"dependencies": {
  "@monorepo/types": "workspace:*",
  ...
}
```

---

## 컨트롤러에서 공유 타입 사용

### apps/api/src/app.controller.ts

```ts
import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from '@monorepo/types';

@Controller()
export class AppController {
  @Get()
  getHello(): ApiResponse<string> {
    return {
      data: 'Hello from API',
      message: 'OK',
      statusCode: 200,
    };
  }
}
```

`ApiResponse<string>`은 `packages/types/src/index.ts`에서 정의한 타입.
백엔드에서 이 타입을 바꾸면 프론트엔드(`admin`)에서도 바로 컴파일 에러가 나서 불일치를 방지할 수 있다.

---

## 포트 설정

### 문제

Next.js(admin)의 기본 포트는 **3000**.
NestJS(api)의 기본 포트도 **3000** (`apps/api/src/main.ts`에 명시).

동시에 실행하면 포트 충돌이 난다.

### 해결

`apps/api/src/main.ts`에서 포트를 4000으로 변경:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
```

- `process.env.PORT ?? 4000` — 환경변수 PORT가 있으면 그걸 쓰고, 없으면 4000.
- 각 앱의 포트는 프레임워크 기본값이 아니라 코드에 직접 적혀 있다.

### 포트 정리

| 앱 | 포트 | 어디서 설정하나 |
|----|------|----------------|
| admin (Next.js) | 3000 | Next.js 기본값. 바꾸려면 `"dev": "next dev --port 3001"` |
| api (NestJS) | 4000 | `apps/api/src/main.ts`의 `app.listen(4000)` |

---

## dev 스크립트 통일

### 문제

NestJS CLI가 생성한 스크립트에는 `dev`가 없고 `start:dev`만 있다.
turbo.json에 `dev` 태스크가 정의되어 있으므로, 루트에서 `pnpm dev`를 실행하면 api가 빠진다.

```
pnpm dev  →  turbo run dev  →  admin: "dev" 스크립트 실행 ✅
                             →  api: "dev" 스크립트 없음 → 건너뜀 ❌
```

### 해결

`apps/api/package.json`의 scripts에 `dev` 추가:

```json
"scripts": {
  "dev": "nest start --watch",
  ...
}
```

이제 `pnpm dev` 한 번이면 admin + api 동시 실행:

```
pnpm dev  →  admin: next dev          (http://localhost:3000)
          →  api: nest start --watch   (http://localhost:4000)
```

---

## 실행 확인

### API 단독 실행

```bash
pnpm dev --filter api
```

http://localhost:4000 접속 → 아래 JSON 응답 확인:

```json
{"data":"Hello from API","message":"OK","statusCode":200}
```

### 전체 동시 실행

```bash
pnpm dev
```

- http://localhost:3000 → Admin Dashboard + Button 렌더링
- http://localhost:4000 → JSON API 응답

---

## 경고 메시지 (무시해도 됨)

### deprecated subdependencies

```
WARN  3 deprecated subdependencies found: glob@10.5.0, glob@7.2.3, inflight@1.0.6
```

NestJS가 사용하는 하위 패키지가 오래된 것. NestJS 측에서 업데이트하면 사라짐. 우리가 할 건 없음.

### Ignored build scripts

```
Ignored build scripts: @nestjs/core@11.1.18, sharp@0.34.5, unrs-resolver@1.11.1
```

pnpm 10의 보안 기능. 일부 패키지가 설치 중 빌드 스크립트를 실행하려는데 pnpm이 막아둔 것.
문제가 생기면 `pnpm approve-builds`로 허용할 수 있다.

---

## 현재 최종 디렉토리 구조

```
monorepo-project/
├── .npmrc
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── apps/
│   ├── admin/                # Next.js (포트 3000)
│   │   ├── package.json      # @monorepo/types, @monorepo/ui 참조
│   │   ├── next.config.ts    # transpilePackages 설정
│   │   └── src/app/page.tsx  # Button + User 타입 사용
│   └── api/                  # NestJS (포트 4000)
│       ├── package.json      # @monorepo/types 참조, dev 스크립트 추가
│       ├── nest-cli.json
│       └── src/
│           ├── main.ts       # 포트 4000으로 변경
│           ├── app.module.ts
│           └── app.controller.ts  # ApiResponse 타입 사용
└── packages/
    ├── types/                # 프론트 + 백엔드 공유 타입
    └── ui/                   # 프론트 앱 공유 UI 컴포넌트
```
