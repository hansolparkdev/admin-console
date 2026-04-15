# shadcn/ui 아키텍처 — 라이브러리 아님, 복사 방식

## 한 줄 정의

shadcn/ui는 npm 패키지가 아니라 **소스 코드를 내 레포에 복사해 넣는 distribution 방식**의 UI 컴포넌트 모음. 설치 후에는 내 코드이므로 자유롭게 수정 가능.

## 왜 이렇게 설계했나

### 일반적인 UI 라이브러리의 문제

예: MUI, Chakra, Mantine 등.

```
[My App] ──import──▶ [@mui/material (node_modules)]
```

- 디자인 수정 = **라이브러리 테마 API**로 우회. 완전 커스터마이징은 깊이 파고들어야 함.
- 번들에 쓰지 않는 컴포넌트까지 tree-shaking 의존.
- **라이브러리 업그레이드가 코드에 영향** — breaking change 시 내 화면이 깨짐.
- 특정 디자인이 정말 안 맞으면 **fork** 또는 **경쟁 라이브러리로 전부 교체**해야 함.

### shadcn 방식

```
[My App] ──import──▶ [src/components/ui/button.tsx (my code)]
                                   │
                                   └─ uses: Radix UI primitives, Tailwind, CVA
```

`pnpm dlx shadcn add button` 하면:
- Radix의 headless 동작(`@radix-ui/react-*`) + Tailwind 클래스 + CVA variants가 조합된 **button.tsx 한 파일**이 내 레포에 생성됨.
- 이후로 그건 내 파일. 어떻게 수정해도 자유.
- 업그레이드가 필요하면 "다시 add"로 덮어쓰거나, 수동으로 diff 보며 필요한 부분만 업데이트.

## 구성 요소

| 레이어 | 누가 |
|---|---|
| **접근성·상호작용** (focus trap, keyboard nav, ARIA) | Radix UI primitives (`radix-ui` 통합 패키지) |
| **스타일링** | Tailwind CSS 4 클래스 |
| **variant 관리** | Class Variance Authority (CVA) |
| **아이콘** | Lucide React (Nova preset) |
| **유틸** | `cn()` = `clsx` + `tailwind-merge` |

각 레이어는 모두 **시장 표준**이고 개별 교체 가능. shadcn은 이들을 엮는 "recipe"만 제공.

## 표준 근거

- **shadcn/ui 공식 철학**: "This is not a component library. It is how you build your component library." — 공식 FAQ 첫 줄.
- **Radix UI**: WAI-ARIA 공식 패턴 구현. Next.js, Vercel, Linear, GitHub 등 실무 대량 사용.
- **CVA**: 저자 Joe Bell, Tailwind 팀과 협업. shadcn 표준.

## 우리 구조에서 어디에

| 파일/폴더 | 역할 |
|---|---|
| `apps/admin/components.json` | shadcn CLI 설정(style, base color, aliases, RSC 여부). `shadcn add <comp>` 시 참조. |
| `apps/admin/src/components/ui/` | 복사된 컴포넌트 파일 (`button.tsx`, `card.tsx`, `input.tsx` …) |
| `apps/admin/src/lib/utils.ts` | `cn()` 헬퍼 — shadcn이 모든 컴포넌트에서 import |
| `apps/admin/src/app/globals.css` | Tailwind 4 CSS-only config. `@theme inline { ... }` 블록에 CSS 변수(`--primary`, `--background` 등), `.dark { ... }`에 다크 테마 팔레트 |
| `apps/admin/package.json` | deps: `radix-ui`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` |

## 설치 흐름

### 초기화 (1회)
```bash
cd apps/admin
pnpm dlx shadcn@latest init
```
프롬프트:
- component library: **Radix**
- preset: **Nova** (Lucide + Geist 조합)

결과: `components.json` + 첫 컴포넌트(Button) + `utils.ts` + `globals.css` CSS 변수.

### 컴포넌트 추가
```bash
pnpm dlx shadcn@latest add card input
```
`src/components/ui/card.tsx`, `input.tsx` 생성. Radix/CVA 등 필요한 의존이 `package.json`에 자동 추가됨.

## 수정 패턴

### 1. variant 추가
`button.tsx`의 CVA 블록에서 `variants.variant.xxx` 항목을 직접 추가.
```tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
      // 커스텀 추가
      brand: "bg-[--color-brand] text-white hover:bg-[--color-brand]/90",
    },
  },
});
```

### 2. 디자인 토큰 교체
`globals.css`의 `:root` 블록에서 CSS 변수값만 바꾸면 전체 테마 반영.
```css
:root {
  --primary: oklch(0.205 0 0);
  /* 브랜드 컬러로 */
  --primary: oklch(0.55 0.18 264);  /* 예: 파랑 */
}
```

### 3. 래핑 (원본 보존)
원본을 건드리고 싶지 않으면 래퍼 컴포넌트 생성:
```tsx
// src/components/ui/brand-button.tsx
import { Button, type ButtonProps } from "./button";
export function BrandButton(props: ButtonProps) {
  return <Button variant="brand" {...props} />;
}
```

## Tailwind 4 CSS-only 모드

shadcn v4.2 + Tailwind 4 조합은 **`tailwind.config.ts` 파일을 만들지 않는다**. 대신 `globals.css`에 다 들어감:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-primary: var(--primary);
  /* ... */
}

:root { --primary: oklch(0.205 0 0); /* ... */ }
.dark { --primary: oklch(0.922 0 0); /* ... */ }
```

장점:
- 설정 파일 하나 줄어듦
- CSS 변수 = 디자인 토큰이 일급 시민
- 다크모드 = `.dark` 클래스 토글로 즉시 반영

## 다크모드

`.dark` 클래스가 걸린 조상 노드 하위에서 `:is(.dark *)` 매칭이 성립 → 모든 `--color-*` 변수가 다크 팔레트로 전환. 토글 방법은 여러 가지:
- `document.documentElement.classList.toggle("dark")` 수동
- `next-themes` 라이브러리 (SSR·시스템 선호도·persistence)

admin-console에는 아직 토글 UI 미구현. 다크 팔레트 CSS만 준비돼있음. 필요할 때 `next-themes` 도입.

## CLAUDE.md와 연결

- 기술 스택: "shadcn/ui + Radix + Tailwind 4 + CVA"
- 워크스페이스 구조 주석: "실제 디자인 시스템은 `apps/admin/src/components/ui/`. 파생 프로젝트 분기 시점에 공용 컴포넌트를 `packages/ui`로 승격."

## 현재 방향 (2026-04-15 확정)

- **core admin 내부에 유지**. shadcn CLI가 Next.js 앱 디렉토리 기준으로 동작하는 것과 정합.
- `packages/ui`는 **비어있는 placeholder**. 파생 프로젝트(`admin-mes` 등) 생길 때 공용으로 쓸 컴포넌트만 **선별적으로** 승격.
- 억지로 모노레포 공유 구조로 만들지 않음 — 공유할 실사용자가 없는 시점에 공용화하면 추상화 부담만 쌓임.

## 대안과 trade-off

| 방식 | 장점 | 단점 |
|---|---|---|
| **shadcn (복사)** | 완전 커스터마이징, vendor lock-in 없음 | 업데이트 수동, diff 봐야 함 |
| MUI / Chakra | 설치 즉시 사용, 일관된 추상화 | 깊은 커스텀 어려움, 번들 무거움 |
| Headless UI (Radix 단독) | 극도의 유연성 | 스타일링 전체 내가 해야 함 |
| Tailwind UI (유료 템플릿) | 고급 디자인 | 복사 후 수동 관리 (shadcn과 비슷하지만 유료) |

shadcn은 **"내 컴포넌트 레시피"** — 라이브러리가 아니라 코드 제너레이터.

## 참고 자료

- [shadcn/ui 공식](https://ui.shadcn.com/)
- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/docs)
- [Tailwind 4 CSS-first config](https://tailwindcss.com/docs/v4-beta)
- [Lucide Icons](https://lucide.dev/)
