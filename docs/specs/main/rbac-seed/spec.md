### Requirement: 초기 역할 Seed

시스템 초기화 시 SUPER_ADMIN과 ADMIN 두 역할이 DB에 생성된다.

#### Scenario: SUPER_ADMIN 역할 Seed 생성
- **Given** `prisma db seed`가 실행된다
- **When** roles 테이블을 조회한다
- **Then** `name='SUPER_ADMIN', isSystem=true` 역할이 존재한다

#### Scenario: ADMIN 역할 Seed 생성
- **Given** `prisma db seed`가 실행된다
- **When** roles 테이블을 조회한다
- **Then** `name='ADMIN', isSystem=false` 역할이 존재한다

#### Scenario: Seed 멱등성
- **Given** Seed가 이미 실행된 상태에서 다시 실행한다
- **When** seed.ts가 실행된다
- **Then** 중복 역할이 생성되지 않는다 (upsert 사용)

---

### Requirement: 초기 메뉴 Seed

시스템 초기화 시 4개의 기본 메뉴가 DB에 생성된다.

#### Scenario: 기본 메뉴 4종 Seed 생성
- **Given** `prisma db seed`가 실행된다
- **When** menus 테이블을 조회한다
- **Then** 대시보드(order=0), 관리자 관리(order=1), 메뉴 관리(order=2), 역할 관리(order=3) 메뉴가 존재한다
- **And** 모두 isActive=true, parentId=null 상태이다

---

### Requirement: 초기 권한 Seed (SUPER_ADMIN)

SUPER_ADMIN 역할에 모든 기본 메뉴에 대한 전체 권한(canRead/canWrite/canDelete=true)이 설정된다.

#### Scenario: SUPER_ADMIN 전체 권한 Seed
- **Given** `prisma db seed`가 실행된다
- **When** roleMenus 테이블에서 SUPER_ADMIN 역할을 조회한다
- **Then** 4개 기본 메뉴 각각에 canRead=true, canWrite=true, canDelete=true RoleMenu가 존재한다

---

### Requirement: 초기 권한 Seed (ADMIN)

ADMIN 역할에 대시보드 메뉴의 읽기 권한만 설정된다.

#### Scenario: ADMIN 대시보드 읽기 권한 Seed
- **Given** `prisma db seed`가 실행된다
- **When** roleMenus 테이블에서 ADMIN 역할을 조회한다
- **Then** 대시보드 메뉴에 canRead=true, canWrite=false, canDelete=false RoleMenu가 존재한다
- **And** 다른 메뉴에 대한 RoleMenu는 없다

---

### Requirement: 기존 사용자 역할 마이그레이션

Prisma 마이그레이션 시 기존 User.role enum 값이 UserRole 관계로 전환된다.

#### Scenario: super_admin 사용자 SUPER_ADMIN 역할 연결
- **Given** 마이그레이션 실행 전 `User.role = 'super_admin'`인 사용자 N명이 있다
- **When** 마이그레이션 SQL이 실행된다
- **Then** 해당 N명 모두에 대해 SUPER_ADMIN 역할과 연결된 UserRole 레코드가 생성된다
- **And** User.role 컬럼이 스키마에서 제거된다

#### Scenario: admin 사용자 ADMIN 역할 연결
- **Given** 마이그레이션 실행 전 `User.role = 'admin'`인 사용자가 있다
- **When** 마이그레이션 SQL이 실행된다
- **Then** 해당 사용자에 대해 ADMIN 역할과 연결된 UserRole 레코드가 생성된다

#### Scenario: role이 null인 사용자 처리
- **Given** 마이그레이션 실행 전 `User.role`이 null인 사용자가 있다
- **When** 마이그레이션 SQL이 실행된다
- **Then** 해당 사용자에 대한 UserRole 레코드는 생성되지 않는다
- **And** 사용자 레코드 자체는 유지된다
