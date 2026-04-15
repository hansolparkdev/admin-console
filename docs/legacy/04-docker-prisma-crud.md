# 04. Docker PostgreSQL + Prisma + 자유게시판 CRUD

## 개요

Docker Compose로 PostgreSQL을 실행하고, Prisma로 DB 스키마를 관리하며,
NestJS의 Module/Controller/Service/DTO 패턴으로 자유게시판 CRUD API를 만든다.

---

## Docker Compose로 PostgreSQL 실행

### docker-compose.yml (루트)

```yaml
services:
  postgres:
    image: postgres:16
    container_name: monorepo-postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin1234
      POSTGRES_DB: monorepo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

| 설정 | 의미 |
|------|------|
| `image: postgres:16` | PostgreSQL 16 버전 사용 |
| `environment` | DB 유저, 비밀번호, 데이터베이스명 설정 |
| `ports: 5432:5432` | 로컬에서 접속 가능하게 포트 연결 |
| `volumes: postgres_data` | 컨테이너 삭제해도 DB 데이터 유지 |

### 명령어

```bash
docker compose up -d        # 실행 (백그라운드)
docker compose ps            # 상태 확인
docker compose logs postgres # 로그 보기
docker compose down          # 종료 (데이터 유지)
docker compose down -v       # 종료 + 데이터 삭제
```

docker-compose.yml을 git에 올리면 다른 개발자나 서버에서도 동일한 DB 환경을 바로 구성할 수 있다.

---

## Prisma 설치 및 초기화

### 설치

```bash
pnpm add prisma @prisma/client --filter api
```

- `prisma` — CLI 도구 (마이그레이션, generate 등)
- `@prisma/client` — 코드에서 DB 조작하는 라이브러리

### 초기화

```bash
cd apps/api
pnpm dlx prisma init
```

생성되는 파일:
- `prisma/schema.prisma` — DB 스키마 정의
- `prisma.config.ts` — DB 접속 설정 (Prisma 7)
- `.env` — 환경변수 (DATABASE_URL)

### .env

```
DATABASE_URL="postgresql://admin:admin1234@localhost:5432/monorepo"
```

docker-compose.yml의 유저/비밀번호/DB명과 일치해야 한다. `.env`는 `.gitignore`에 추가해서 git에 올리지 않는다.

---

## Prisma 7 주의사항

Prisma 7에서 이전 버전과 크게 바뀐 점들:

| 항목 | Prisma 6 이하 | Prisma 7 |
|------|--------------|----------|
| DB URL 설정 | schema.prisma에 `url = env("DATABASE_URL")` | prisma.config.ts에서 설정. schema.prisma에서 url 제거. |
| PrismaClient 생성 | `new PrismaClient()` 빈 생성자 | `new PrismaClient({ adapter })` 어댑터 필수 |
| DB 드라이버 | Prisma가 Rust 엔진으로 내부 처리 | `pg` 등 JS 드라이버를 직접 설치해서 전달 |
| migrate dev 후 generate | 자동 실행 | 수동으로 `prisma generate` 별도 실행 필요 |
| .env 로드 | Prisma가 자동으로 읽음 | `@nestjs/config`의 ConfigModule 등으로 직접 로드 |

### 추가 설치 (Prisma 7 필수)

```bash
pnpm add @prisma/adapter-pg pg --filter api        # PostgreSQL 어댑터 + 드라이버
pnpm add -D @types/pg --filter api                   # pg 타입 정의
pnpm add @nestjs/config --filter api                 # .env 로드용
```

| 패키지 | 역할 |
|--------|------|
| `@prisma/adapter-pg` | Prisma와 pg를 연결해주는 어댑터 |
| `pg` | PostgreSQL Node.js 드라이버 (실제 DB 통신) |
| `@nestjs/config` | .env 파일을 읽어서 process.env에 로드 |

---

## schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  author    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- `generator client` — `prisma generate` 실행 시 Prisma Client 코드를 자동 생성
- `datasource db` — PostgreSQL 사용. URL은 prisma.config.ts에서 설정 (Prisma 7)
- `model Post` — DB 테이블 정의. 이걸 기반으로 마이그레이션 SQL과 TypeScript 타입이 생성됨

### 마이그레이션

```bash
cd apps/api
pnpm dlx prisma migrate dev --name init    # 마이그레이션 실행
pnpm dlx prisma generate                    # Prisma Client 재생성 (Prisma 7 필수)
```

- `migrate dev` — schema.prisma와 DB를 비교해서 차이가 있으면 SQL 생성 + 적용
- `generate` — schema.prisma를 보고 node_modules에 TypeScript 코드 생성
- `--name init` — 마이그레이션 이름표. 안 붙이면 이름을 물어봄

### 마이그레이션 폴더

```
prisma/migrations/
  ├── 20260413_init/           # 최초 생성
  ├── 20260415_add_category/   # 나중에 추가
  └── migration_lock.toml      # DB 종류 잠금 (PostgreSQL)
```

- 변경할 때마다 폴더가 하나씩 쌓임 (git 커밋처럼 이력)
- **절대 삭제하면 안 됨** — DB의 `_prisma_migrations` 테이블과 매칭됨
- **반드시 git에 포함** — 다른 개발자가 pull 받고 migrate dev 하면 자동 적용
- 이미 적용된 마이그레이션은 다시 실행 안 됨 (DB에 기록되어 있음)

---

## NestJS 프로젝트 구조

### Module / Controller / Service 패턴

```
src/
├── app.module.ts          ← 전체 모듈 조립
├── main.ts                ← 서버 진입점
├── prisma/                ← DB 연결 (인프라)
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── post/                  ← 자유게시판 (도메인)
    ├── post.module.ts
    ├── post.controller.ts
    ├── post.service.ts
    └── dto/
        ├── create-post.dto.ts
        └── update-post.dto.ts
```

| 파일 | 역할 |
|------|------|
| Controller | 요청 받고 응답 보냄 (라우터). 어떤 URL이 어떤 메서드를 호출하는지 정의. |
| Service | 실제 로직 처리 (DB 조작). Controller가 호출함. |
| Module | Controller + Service를 묶어서 NestJS에 등록. |
| DTO | 요청 데이터의 형태와 검증 규칙 정의. |

### CLI로 리소스 한 번에 생성

```bash
pnpm exec nest generate resource post --no-spec
```

Controller, Service, Module, DTO를 한 번에 만들어줌. `--no-spec`은 테스트 파일 생략.

---

## 핵심 파일 상세

### prisma.service.ts

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL!);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

- `PrismaClient`를 상속받아 NestJS의 DI(의존성 주입)에 등록
- Prisma 7: `PrismaPg` 어댑터로 DB 연결 방법을 명시적으로 전달
- `onModuleInit` — 앱 시작 시 자동으로 DB 연결
- 앱 전체에서 하나의 인스턴스를 공유 (매번 새로 연결하지 않음)

### prisma.module.ts

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- `@Global()` — AppModule에 한 번 등록하면 어디서든 PrismaService 사용 가능
- `exports` — 다른 모듈에서 PrismaService를 주입받을 수 있게 내보냄

### app.module.ts

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot(),  // .env 로드
    PrismaModule,            // DB 연결
    PostModule,              // 자유게시판
  ],
})
export class AppModule {}
```

- `ConfigModule.forRoot()` — .env 파일을 읽어서 process.env에 로드. 이게 없으면 DATABASE_URL이 undefined.
- 기능이 늘어나면 여기에 모듈만 추가하면 됨.

### main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
```

- `ValidationPipe` — DTO의 데코레이터(@IsString 등)를 실제로 검증. 이걸 안 넣으면 검증이 안 됨.
- `whitelist: true` — DTO에 정의 안 된 필드는 자동 제거 (보안).

---

## DTO (Data Transfer Object)

### create-post.dto.ts

```ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  author: string;
}
```

- DTO는 **클라이언트가 보내야 하는 데이터만** 정의
- id, createdAt, updatedAt은 DB가 자동 생성하므로 DTO에 없음
- `@IsString()`, `@IsNotEmpty()` — class-validator의 데코레이터. 조건 불충족 시 자동으로 400 에러 응답.

### update-post.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

- `PartialType` — CreatePostDto의 모든 필드를 선택사항(optional)으로 만듦
- 수정할 때 제목만 바꿀 수도, 내용만 바꿀 수도 있으니까

### class-validator / class-transformer 설치

```bash
pnpm add class-validator class-transformer --filter api
```

- `class-validator` — DTO 필드에 검증 규칙 데코레이터 제공
- `class-transformer` — 요청 데이터를 DTO 클래스로 변환. class-validator가 동작하려면 필요.

---

## Service (CRUD 로직)

### post.service.ts

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePostDto) {
    return this.prisma.post.create({ data: dto });
  }

  findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`게시글 #${id}을 찾을 수 없습니다`);
    return post;
  }

  async update(id: number, dto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
```

| 메서드 | Prisma 메서드 | SQL 대응 |
|--------|--------------|----------|
| `create` | `prisma.post.create({ data })` | INSERT |
| `findAll` | `prisma.post.findMany()` | SELECT * ORDER BY |
| `findOne` | `prisma.post.findUnique({ where })` | SELECT WHERE id = ? |
| `update` | `prisma.post.update({ where, data })` | UPDATE WHERE id = ? |
| `remove` | `prisma.post.delete({ where })` | DELETE WHERE id = ? |

- `constructor(private prisma: PrismaService)` — NestJS가 PrismaService를 자동 주입
- `NotFoundException` — 게시글이 없으면 404 응답. update/remove에서 findOne을 먼저 호출해서 존재 확인 + 에러 처리 중복 제거.

---

## Controller (라우팅)

### post.controller.ts

```ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
```

| 데코레이터 | HTTP | URL | 용도 |
|-----------|------|-----|------|
| `@Post()` | POST | `/post` | 생성 |
| `@Get()` | GET | `/post` | 전체 목록 |
| `@Get(':id')` | GET | `/post/1` | 단건 조회 |
| `@Patch(':id')` | PATCH | `/post/1` | 수정 |
| `@Delete(':id')` | DELETE | `/post/1` | 삭제 |

- `@Body()` — 요청 body에서 데이터 꺼냄
- `@Param('id')` — URL에서 id 꺼냄
- `+id` — 문자열을 숫자로 변환 (`"1"` → `1`)
- NestJS CLI가 생성한 그대로 사용. 수정 불필요.

---

## API 테스트

```bash
# 생성
curl -X POST http://localhost:4000/post \
  -H "Content-Type: application/json" \
  -d '{"title": "첫 게시글", "content": "내용입니다", "author": "홍길동"}'

# 전체 조회
curl http://localhost:4000/post

# 단건 조회
curl http://localhost:4000/post/1

# 수정
curl -X PATCH http://localhost:4000/post/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "수정된 제목"}'

# 삭제
curl -X DELETE http://localhost:4000/post/1
```

---

## 핵심 정리

1. **Docker Compose**로 DB를 관리하면 어디서든 동일한 환경을 재현할 수 있다.
2. **Prisma 7**은 이전 버전과 설정 방식이 많이 다르다 (어댑터 필수, generate 수동, .env 수동 로드).
3. **NestJS CRUD 패턴**: Controller(라우팅) → Service(로직) → Prisma(DB). 기능 추가 시 도메인 폴더만 추가.
4. **DTO + ValidationPipe**로 요청 데이터를 자동 검증. 필드마다 if문 안 써도 됨.
5. **스키마 변경 흐름**: schema.prisma 수정 → `prisma migrate dev` → `prisma generate`.
