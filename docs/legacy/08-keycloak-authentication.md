# 08. Keycloak 인증 연동

## 개요

Keycloak을 Docker로 띄우고, NestJS API에서 Keycloak이 발급한 JWT 토큰을 검증하도록 설정한다.
기존 직접 구현한 JWT 인증과 Keycloak 인증이 **동시에** 동작하도록 구성.

---

## Keycloak이란?

오픈소스 **인증/인가 서버**. 로그인, 회원가입, 소셜 로그인, 권한 관리를 모두 처리해주는 서비스.

직접 구현 vs Keycloak:

| | 직접 구현 | Keycloak |
|---|---|---|
| 로그인/회원가입 | 직접 코드 작성 | Keycloak이 UI + 로직 제공 |
| 소셜 로그인 | 각 소셜마다 구현 | 관리 콘솔에서 클릭 몇 번 |
| 비밀번호 정책 | 직접 구현 | 설정으로 관리 |
| 토큰 관리 | 직접 구현 | 자동 |
| 우리 서버가 할 일 | 발급 + 검증 | **검증만** |

---

## Docker Compose에 Keycloak 추가

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16
    container_name: monorepo-postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin1234
      POSTGRES_DB: core
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    container_name: monorepo-keycloak
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin1234
    ports:
      - "8080:8080"
    command: start-dev

volumes:
  postgres_data:
```

| 설정 | 의미 |
|------|------|
| `KC_BOOTSTRAP_ADMIN_USERNAME` | Keycloak 관리자 계정 |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | Keycloak 관리자 비밀번호 |
| `start-dev` | 개발 모드 (HTTPS 없이 실행) |
| 포트 8080 | Keycloak 관리 콘솔 |

```bash
docker compose up -d
```

---

## Keycloak 관리 콘솔 설정

http://localhost:8080 접속 → admin / admin1234 로그인

### 1. Realm 생성

Realm = 인증을 관리하는 독립된 공간. 프로젝트마다 하나.

- 좌측 상단 "master" 드롭다운 → Create realm
- Realm name: `core`

### 2. Client 생성

Client = Keycloak에 접속하는 앱.

- Clients → Create client
- Client ID: `admin-app`
- Client authentication: **OFF** (프론트엔드는 public client)
- Valid redirect URIs: `http://localhost:3000/*`
- Valid post logout redirect URIs: `http://localhost:3000/*`
- Web origins: `http://localhost:3000`

| 설정 | 의미 |
|------|------|
| Client authentication OFF | 프론트엔드(SPA)는 secret을 안전하게 보관할 수 없으므로 public client |
| Valid redirect URIs | 로그인 후 돌아갈 수 있는 URL. 이 외의 URL로는 리다이렉트 차단. |
| Web origins | CORS 허용할 출처 |

### 3. 테스트 유저 생성

- Users → Create new user
- Username, Email, First name, Last name 입력
- Credentials 탭 → Set password → Temporary OFF

---

## NestJS에서 Keycloak 토큰 검증

### 패키지 설치

```bash
pnpm add jwks-rsa --filter api
```

`jwks-rsa` — Keycloak의 공개키를 자동으로 가져와서 토큰을 검증하는 라이브러리.

### 기존 JWT vs Keycloak 토큰 검증 방식

| | 기존 JWT | Keycloak |
|---|---|---|
| 서명 방식 | 대칭키 (같은 secret key로 생성/검증) | 비대칭키 (개인키로 생성, 공개키로 검증) |
| 설정 | `secretOrKey: 'my-secret-key'` | `secretOrKeyProvider: jwks(공개키 URL)` |
| 토큰 발급 | 우리 서버 | Keycloak |

### keycloak.strategy.ts

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: 'http://localhost:8080/realms/core',
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: 'http://localhost:8080/realms/core/protocol/openid-connect/certs',
      }),
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.preferred_username,
    };
  }
}
```

| 코드 | 의미 |
|------|------|
| `PassportStrategy(Strategy, 'keycloak')` | `'keycloak'`이라는 이름으로 등록. 기존 `'jwt'`와 구분. |
| `jwksUri` | Keycloak이 공개키를 제공하는 URL. 이 공개키로 토큰 서명을 검증. |
| `issuer` | 토큰 발급자 확인. 다른 서버에서 발급한 토큰 차단. |
| `RS256` | Keycloak이 쓰는 서명 알고리즘. |

### auth.module.ts

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { KeycloakStrategy } from './keycloak.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: 'my-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, KeycloakStrategy],
})
export class AuthModule {}
```

---

## 두 인증 방식 동시 지원 (Combined Guard)

### combined.guard.ts

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'keycloak']) {}
```

`AuthGuard(['jwt', 'keycloak'])` — jwt 먼저 시도, 실패하면 keycloak 시도. 둘 중 하나라도 통과하면 인증 성공.

### post.controller.ts에서 Guard 교체

```ts
import { CombinedAuthGuard } from '../auth/combined.guard';

@Post()
@UseGuards(CombinedAuthGuard)   // 기존 JWT 토큰, Keycloak 토큰 둘 다 허용
create(@Body() createPostDto: CreatePostDto) { ... }
```

---

## 테스트

### Keycloak 토큰 발급

```bash
curl -X POST http://localhost:8080/realms/core/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-app" \
  -d "username=testuser" \
  -d "password=123456" \
  -d "grant_type=password"
```

### Keycloak 토큰으로 게시글 생성

```bash
curl -X POST http://localhost:4000/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 여기에keycloak토큰" \
  -d '{"title": "Keycloak 인증 게시글", "content": "내용", "author": "testuser"}'
```

### 기존 JWT 토큰으로도 동일하게 동작

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123456"}'

# 받은 accessToken으로 게시글 생성 — 여전히 동작
```

---

## Google 소셜 로그인 (나중에 추가)

Keycloak 관리 콘솔에서 Identity Providers → Google 추가하면 된다.
Google Cloud Console에서 OAuth Client ID를 발급받아서 Keycloak에 등록.
NestJS 코드 수정 없이 Keycloak 설정만으로 소셜 로그인 추가 가능.

---

## 현재 인증 구조

```
로그인 방식
├── 이메일 + 비밀번호 → 우리 서버가 JWT 발급 → jwt Strategy로 검증
└── Keycloak 로그인   → Keycloak이 JWT 발급 → keycloak Strategy로 검증

CombinedAuthGuard → 둘 중 하나라도 통과하면 API 접근 허용
```

## 핵심 정리

1. Keycloak은 인증을 **대신 처리**해주는 서버. 우리는 토큰 검증만 하면 됨.
2. `jwks-rsa`로 Keycloak의 **공개키를 자동으로 가져와서** 토큰 검증.
3. Strategy 이름을 다르게 지정하면 **여러 인증 방식을 동시에** 사용 가능.
4. `AuthGuard(['jwt', 'keycloak'])` — 배열로 넘기면 순서대로 시도.
5. 소셜 로그인은 Keycloak 관리 콘솔에서 설정만 하면 **코드 수정 없이** 추가 가능.
