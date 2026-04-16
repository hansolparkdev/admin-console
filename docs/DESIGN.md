# DESIGN.md — Admin Console 디자인 토큰

> 출처: Google Stitch "Admin Console Layout" 프로젝트 (`projects/4047049138455434101`) — The Executive Lens 테마.
> 실제 토큰은 `apps/admin/src/app/globals.css`의 CSS 변수가 단일 진실원.
> 이 문서는 Stitch에서 추출한 디자인 토큰 참조용 (사람 읽는 버전).

## 철학: The Precision Architect

일반적인 어드민 콘솔의 "bootstrap" 룩을 벗어나, 고급 데이터 대시보드의 느낌. 1px 보더로 섹션을 나누는 대신 **톤 레이어링**으로 깊이 표현. 편집 디자인 감각의 타이포그래피(Manrope 헤더 + Inter 본문)로 시선을 유도.

### No-Line 원칙

- 섹션 구분에 1px solid border 사용 금지
- 대신 배경 톤 전환으로 경계 표현
- `surface_container_low` (본문) ↔ `surface_container_lowest` (카드)로 자연스러운 lift

---

## 색상 (Light Mode)

### Primary

| 역할 | 토큰 | 값 |
|---|---|---|
| Primary | `primary` | `#0053db` |
| Primary Dim | `primary_dim` | `#0048c1` |
| Primary Container | `primary_container` | `#dbe1ff` |
| On Primary | `on_primary` | `#f8f7ff` |
| On Primary Container | `on_primary_container` | `#0048bf` |

### Surface 계층

| Level | 토큰 | 값 | 용도 |
|---|---|---|---|
| 0 (Base) | `surface` | `#f7f9fb` | 글로벌 배경 |
| 1 (Sectioning) | `surface_container_low` | `#f0f4f7` | 본문 영역 |
| 2 (Active Cards) | `surface_container_lowest` | `#ffffff` | 카드·패널 |
| 3 (Container) | `surface_container` | `#e8eff3` | 보조 섹션 |
| 4 (High) | `surface_container_high` | `#e1e9ee` | 활성 영역 |
| 5 (Highest) | `surface_container_highest` | `#d9e4ea` | Secondary 버튼 |
| Dim (Anchor) | `surface_dim` | `#cfdce3` | 사이드바 anchor |

### Text

| 역할 | 토큰 | 값 |
|---|---|---|
| Body | `on_surface` | `#2a3439` |
| Secondary | `on_surface_variant` | `#566166` |
| Outline | `outline` | `#717c82` |
| Outline Variant | `outline_variant` | `#a9b4b9` |

순수 검정(`#000`) 금지 — `on_surface`로 톤 조화.

### Secondary / Tertiary

| 역할 | 토큰 | 값 |
|---|---|---|
| Secondary | `secondary` | `#526074` |
| Secondary Container | `secondary_container` | `#d5e3fc` |
| On Secondary Container | `on_secondary_container` | `#455367` |
| Tertiary | `tertiary` | `#605c78` |
| Tertiary Container | `tertiary_container` | `#e3dbfd` |

### Error

| 역할 | 토큰 | 값 |
|---|---|---|
| Error | `error` | `#9f403d` |
| Error Container | `error_container` | `#fe8983` |
| On Error Container | `on_error_container` | `#752121` |

---

## 타이포그래피

### Font Families

| 역할 | 폰트 |
|---|---|
| Display / Headline | **Manrope** (geometric·warm curves) |
| Body / Label | **Inter** (data density·legibility) |
| 한글 | **Pretendard** (fallback) |
| Monospace | **Geist Mono** |

### Scale

| 역할 | 크기 | 굵기 | 용도 |
|---|---|---|---|
| Display-LG | 3.5rem (56px) | 700 | "At a Glance" 메트릭 |
| Display-SM | 2.25rem (36px) | 700 | 대시보드 오버뷰 |
| Headline-SM | 1.5rem (24px) | 600 | 페이지 타이틀 |
| Title-SM | 1rem (16px) | 600 | 카드 헤더 |
| Body-MD | 1rem (16px) | 400 | 본문 |
| Body-SM | 0.875rem (14px) | 400 | 보조 텍스트 |
| Label-MD | 0.75rem (12px) | 500 | 테이블 헤더 (All-Caps + letter-spacing 0.05em) |

---

## 간격 (8px Linear Scale)

```
8 / 16 / 24 / 32 / 40 / 48 / 56 / 64
```

- 페이지 margin: 40px (5x)
- 컴포넌트 internal padding: 12px 또는 16px
- 섹션 gap: 32px 또는 48px

---

## 보더 반경 (Roundness: ROUND_FOUR)

| 역할 | 값 |
|---|---|
| sm | 2px |
| md | 6px (버튼·인풋) |
| lg | 8px (카드) |
| xl | 12px |
| full | 9999px (Filter Chip) |

---

## Elevation & Depth

### Tonal Layering

깊이는 **톤 스택**으로. 테이블을 `surface_container_lowest` 위에 두고, 그 테이블은 `surface_container_low` 페이지 배경 위에.

### Ambient Shadow (Floating 요소만)

```css
box-shadow: 0px 12px 32px rgba(42, 52, 57, 0.06);
```

`on_surface` 컬러 기반. 일반 검정 shadow 금지.

### Ghost Border (고밀도 폼에만)

```css
outline: 1px solid rgba(169, 180, 185, 0.2);
```

`outline_variant` 20% 투명도. 느껴지되 보이지 않게.

---

## Glass & Gradient

### Hero CTA 그라데이션

```css
background: linear-gradient(135deg, #0053db, #0048c1);
```

### Floating Navigation (Glassmorphism)

```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
```

---

## 컴포넌트 규칙

### Buttons

| Variant | Background | Text |
|---|---|---|
| Primary | Gradient `primary → primary_dim` | `on_primary` |
| Secondary | `surface_container_highest` | `on_surface` |
| Tertiary | Transparent | `primary` (hover 시에만 container) |

모두 `md` (6px) radius. Border 없음.

### Input Fields

- Soft Underline 방식 또는 `surface_container_highest` 배경 + 2px `primary` bottom border (focus 시에만)
- Error: `error` 텍스트 + `error_container` 10% 배경

### Tables

- **No Dividers** — 수평 divider line 금지
- Alternating tones: 짝수 row에 `surface_container_low`
- Vertical padding: 16~20px (데이터 breathing)

### Data Chips

| Type | Background | Text | Radius |
|---|---|---|---|
| Filter Chip | `secondary_container` | `on_secondary_container` | `full` (9999px) |

---

## Do's / Don'ts

### Do

- 대시보드에 비대칭 레이아웃 사용 (Primary 8컬럼 + Secondary 4컬럼)
- 사이드바 Selected 상태에 `primary_fixed_dim` (soft glow)
- 데이터 밀집 시 divider 대신 padding 증가

### Don't

- 순수 검정(`#000`) 텍스트 금지 — `on_surface` (`#2a3439`)
- `primary`(파랑)를 Success 상태에 쓰지 않기 — Success는 별도 green
- 버튼에 Drop Shadow 금지 — hover는 `surface_dim` 배경 shift

---

## 반응형 브레이크포인트

- 모바일: `~767px`
- 태블릿: `768~1023px`
- 데스크톱: `1024px~`
- 와이드: `1440px~`

## 터치 타겟

최소 44×44px (iOS HIG).

---

## Z-index

- Base: 0
- Dropdown: 1000
- Sticky: 1100
- Overlay: 1200
- Modal: 1300
- Popover: 1400
- Toast: 1500

---

## 컴포넌트 초기 목록 (`apps/admin/src/components/ui`)

Button · Input · Card (shadcn 기본) / Label · Textarea · Select · Dialog · Sheet · Tabs · Table · Form · Toast · Badge · Alert · DropdownMenu · Calendar · TreeView (필요 시 `shadcn add`)

## 운영 원칙

- CVA로 variant 관리 (`class-variance-authority`)
- 토큰은 CSS 변수로 — `globals.css`가 단일 진실원
- shadcn 컴포넌트는 `components/ui/` 내부. 수정 자유 (복사 방식)
- 디자인 변경 시 `globals.css`의 CSS 변수만 수정 → 전 화면 자동 반영
