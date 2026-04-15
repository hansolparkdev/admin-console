# 07. JWT 인증 구현

## 개요

회원가입 → 로그인 → JWT 토큰 발급 → 토큰으로 API 접근 제어.
직접 구현하여 토큰 기반 인증의 원리를 이해한다.

---

## JWT(JSON Web Token)란?

로그인 성공 시 서버가 발급하는 **인증 토큰**. 클라이언트가 이후 요청마다 이 토큰을 보내면 서버가 "이 사람은 인증된 사용자"라고 판단한다.

```
1. 로그인 요청 (이메일 + 비밀번호)
2. 서버가 검증 후 JWT 토큰 발급
3. 클라이언트가 토큰을 저장
4. 이후 API 요청마다 헤더에 토큰 첨부
5. 서버가 토큰 검증 후 응답
```

### 토큰 구조

```
eyJhbGciOiJIUzI1NiIs...  (Header.Payload.Signature)
```

- Header: 알고리즘 정보
- Payload: 유저 정보 (`{ sub: 1, email: "test@test.com" }`)
- Signature: secret key로 서명한 값. 이걸로 위조 여부 확인.

secret key를 모르면 올바른 서명을 만들 수 없으므로 토큰 위조 불가.
**secret key가 노출되면 누구나 유효한 토큰을 만들 수 있으므로 절대 노출 금지.**

---

## 설치

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt --filter api
pnpm add -D @types/passport-jwt @types/bcrypt --filter api
```

| 패키지 | 역할 |
|--------|------|
| `@nestjs/jwt` | JWT 토큰 생성/검증 |
| `@nestjs/passport` | NestJS에서 Passport 사용할 수 있게 연결 |
| `passport` | 인증 미들웨어. 인증 방법을 플러그인(Strategy)으로 끼워넣는 프레임워크. Node.js 인증의 사실상 표준. |
| `passport-jwt` | JWT Strategy. 토큰 검증 로직이 들어있음. |
| `bcrypt` | 비밀번호 해싱. DB에 평문 저장 방지. |

---

## Passport란?

인증 방법을 **플러그인(Strategy)**으로 끼워넣는 프레임워크.

```
Passport (프레임워크)
├── JWT Strategy      ← 토큰으로 인증
├── Local Strategy    ← 이메일/비밀번호로 인증
├── Google Strategy   ← 구글 OAuth로 인증
└── Kakao Strategy    ← 카카오 OAuth로 인증
```

Strategy 패키지가 500개 이상 있어서 어떤 인증 방식이든 플러그인처럼 추가 가능.

각 Strategy 패키지는 고유한 이름을 가짐:

| 패키지 | Strategy 이름 |
|--------|--------------|
| `passport-jwt` | `'jwt'` |
| `passport-local` | `'local'` |
| `passport-google-oauth20` | `'google'` |
| `passport-kakao` | `'kakao'` |

---

## DB에 User 모델 추가

### prisma/schema.prisma

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
pnpm dlx prisma migrate dev --name add_user
pnpm dlx prisma generate
```

### packages/types에 User 타입

```ts
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

**password는 넣지 않는다.** 프론트에 비밀번호를 보내면 안 되니까.

---

## auth 모듈 생성

```bash
pnpm exec nest generate resource auth --no-spec
```

REST API 선택, CRUD entry points는 No.

---

## 파일별 구현

### dto/signup.dto.ts

```ts
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### dto/login.dto.ts

```ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### auth.service.ts

```ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });

    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 틀렸습니다');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('이메일 또는 비밀번호가 틀렸습니다');

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });

    return { accessToken: token };
  }
}
```

**회원가입 흐름:**
1. 이메일 중복 확인 → 있으면 409 에러
2. `bcrypt.hash(password, 10)` → 비밀번호를 해시값으로 변환. DB에 평문 저장 방지.
3. DB에 유저 생성
4. `const { password, ...result } = user` → password 필드를 빼고 반환

**로그인 흐름:**
1. 이메일로 유저 찾기 → 없으면 401
2. `bcrypt.compare()` → 입력된 비밀번호와 해시값 비교 → 불일치면 401
3. `jwt.signAsync({ sub, email })` → JWT 토큰 발급. sub은 JWT 표준 필드(subject=누구인지).

### auth.controller.ts

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

- `POST /auth/signup` — 회원가입
- `POST /auth/login` — 로그인 → `{ accessToken: "eyJ..." }` 반환

### auth.module.ts

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: 'my-secret-key',           // 토큰 서명용 비밀키. 실무에서는 .env.
      signOptions: { expiresIn: '1h' },  // 1시간 후 만료
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

### jwt.strategy.ts — JWT Guard의 핵심

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'my-secret-key',
    });
  }

  validate(payload: { sub: number; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

| 코드 | 의미 |
|------|------|
| `PassportStrategy(Strategy)` | passport-jwt의 Strategy를 NestJS에 연결. 자동으로 `'jwt'`라는 이름으로 등록됨. |
| `ExtractJwt.fromAuthHeaderAsBearerToken()` | 요청 헤더의 `Authorization: Bearer xxx`에서 토큰을 꺼냄 |
| `secretOrKey` | auth.module의 secret과 동일해야 함. 토큰 검증에 사용. |
| `validate()` | 토큰이 유효하면 호출됨. 반환값이 `request.user`에 들어감. |

---

## Guard 적용

### post.controller.ts

```ts
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Post()
@UseGuards(AuthGuard('jwt'))     // 이 엔드포인트는 토큰 필수
create(@Body() createPostDto: CreatePostDto) { ... }

@Get()
findAll() { ... }                // Guard 없음 → 누구나 조회 가능

@Patch(':id')
@UseGuards(AuthGuard('jwt'))     // 토큰 필수
update(...) { ... }

@Delete(':id')
@UseGuards(AuthGuard('jwt'))     // 토큰 필수
remove(...) { ... }
```

- 조회는 Guard 없음 → 비로그인도 가능
- 생성/수정/삭제는 Guard 있음 → 로그인한 사람만 가능

### Guard 동작 흐름

```
요청 들어옴
  → @UseGuards(AuthGuard('jwt'))
    → 'jwt' 이름으로 등록된 JwtStrategy 찾음
      → 헤더에서 토큰 꺼냄
        → secret key로 서명 검증
          → 유효하면 validate() 호출 → Controller 실행
          → 무효하면 401 Unauthorized
```

---

## 테스트

```bash
# 회원가입
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123456", "name": "홍길동"}'

# 로그인 → accessToken 받기
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123456"}'

# 토큰 없이 게시글 생성 → 401
curl -X POST http://localhost:4000/post \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트", "content": "내용", "author": "홍길동"}'

# 토큰으로 게시글 생성 → 성공
curl -X POST http://localhost:4000/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 여기에토큰" \
  -d '{"title": "인증된 게시글", "content": "토큰으로 작성", "author": "홍길동"}'
```

---

## 핵심 정리

1. **Passport**는 인증 방법을 플러그인(Strategy)으로 끼워넣는 프레임워크. Node.js 표준.
2. **Strategy**는 "토큰을 어디서 꺼내고, 어떻게 검증할지" 정의. 패키지마다 고유 이름이 있음.
3. **Guard**는 "이 엔드포인트에 Strategy를 적용해라"라는 스위치. `@UseGuards(AuthGuard('jwt'))`.
4. **bcrypt**로 비밀번호 해싱. DB에 평문 저장 절대 금지.
5. **secret key**가 노출되면 누구나 유효한 토큰을 만들 수 있으므로 `.env`로 관리.

```bash
curl -X POST http://localhost:4000/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIzZk96dnJ0UDJTN3FEdUl3TmVTaGhVTWN4SEJPYVZ5aTkyZG8wMnBBM0pVIn0.eyJleHAiOjE3NzYwNjk3NTUsImlhdCI6MTc3NjA2OTQ1NSwianRpIjoiMmNiOWI1MzItMjBmYi00YmVlLTg0MjMtYjE5NDBiOTI2OThjIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jb3JlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3YmMxZTYzLTNmM2YtNGQ4YS1hOGQ3LTU2NzBjODg3ODFhMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFkbWluLWFwcCIsInNpZCI6IjUxYzI0ZWZkLTI5MzUtNDgxNi1iNmJmLTNhN2U2ZmEwZjBiOCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtY29yZSIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidGVzdCB0ZXN0IiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJnaXZlbl9uYW1lIjoidGVzdCIsImZhbWlseV9uYW1lIjoidGVzdCIsImVtYWlsIjoiZ2hkY25zMjFAbmF2ZXIuY29tIn0.dmiiO3ZATU45KCO5cHx1iwBPnJmDSsoB5E5ZT3NOocge7ruOlbhyJ4DmU-TcxqhTGOpoyDCHHTldqC8VASvX6_JC94pZ9WzlUj32-3sH2k931jsZImxo96QHOb_cwHcF15C3Dn9TxdYm1nFG4yu7IH_ydQCPQd_h2tA71xn5m4AkSsmtZcvysrH1CSVYG6SPYsZ4vti1uZmwDW1TxSCLGWdKIJvM3Py2_6AhSSvVrtPfR-q0GQS7Nfzl_vHNQv8nJf_BexILGrz5wx4ojexOF5-zUhhdWDraZHk0iGLkcXwF6VRUcXSdpYt3CtgunbHAENhw4EjJnFxjyeuddrs58g" \
  -d '{"title": "Keycloak 인증 게시글", "content": "내용", "author": "testuser"}'
```

eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIzZk96dnJ0UDJTN3FEdUl3TmVTaGhVTWN4SEJPYVZ5aTkyZG8wMnBBM0pVIn0.eyJleHAiOjE3NzYwNjk3NTUsImlhdCI6MTc3NjA2OTQ1NSwianRpIjoiMmNiOWI1MzItMjBmYi00YmVlLTg0MjMtYjE5NDBiOTI2OThjIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jb3JlIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3YmMxZTYzLTNmM2YtNGQ4YS1hOGQ3LTU2NzBjODg3ODFhMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFkbWluLWFwcCIsInNpZCI6IjUxYzI0ZWZkLTI5MzUtNDgxNi1iNmJmLTNhN2U2ZmEwZjBiOCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtY29yZSIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidGVzdCB0ZXN0IiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJnaXZlbl9uYW1lIjoidGVzdCIsImZhbWlseV9uYW1lIjoidGVzdCIsImVtYWlsIjoiZ2hkY25zMjFAbmF2ZXIuY29tIn0.dmiiO3ZATU45KCO5cHx1iwBPnJmDSsoB5E5ZT3NOocge7ruOlbhyJ4DmU-TcxqhTGOpoyDCHHTldqC8VASvX6_JC94pZ9WzlUj32-3sH2k931jsZImxo96QHOb_cwHcF15C3Dn9TxdYm1nFG4yu7IH_ydQCPQd_h2tA71xn5m4AkSsmtZcvysrH1CSVYG6SPYsZ4vti1uZmwDW1TxSCLGWdKIJvM3Py2_6AhSSvVrtPfR-q0GQS7Nfzl_vHNQv8nJf_BexILGrz5wx4ojexOF5-zUhhdWDraZHk0iGLkcXwF6VRUcXSdpYt3CtgunbHAENhw4EjJnFxjyeuddrs58g