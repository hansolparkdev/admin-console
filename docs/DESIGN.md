# DESIGN.md — AXIS 디자인 토큰

> 실제 토큰은 `packages/config-tailwind/preset.ts`와 `packages/ui`의 CSS 변수로 이식.
> 이 문서는 단일 기준 (source of truth).

## 색상
| 역할 | 값 | 용도 |
|------|-----|------|
| 프라이머리 | `#2563EB` | 주요 CTA, 링크, 선택 상태 |
| 프라이머리 호버 | `#1D4ED8` | 프라이머리 hover/active |
| 위험 | `#DC2626` | 삭제/에러 |
| 경고 | `#D97706` | 주의 |
| 성공 | `#16A34A` | 성공/활성 |
| 정보 | `#0891B2` | 안내 |
| 배경 | `#FFFFFF` | 페이지 배경 |
| 표면 | `#F9FAFB` | 카드/패널 배경 |
| 표면 강조 | `#F3F4F6` | hover·selected row |
| 텍스트 기본 | `#111827` | 본문 |
| 텍스트 보조 | `#6B7280` | 라벨·placeholder |
| 텍스트 비활성 | `#9CA3AF` | disabled |
| 보더 | `#E5E7EB` | 기본 경계선 |
| 보더 강조 | `#D1D5DB` | focus ring 외곽 |

### 다크 모드 (반전)
- 배경 `#0B0F17` / 표면 `#111827` / 텍스트 기본 `#F9FAFB` / 보더 `#1F2937`

## 타이포그래피
기본 폰트: `Inter`, 한글 `Pretendard`, fallback `system-ui`.

| 역할 | 크기 | 굵기 | 행간 |
|------|------|------|------|
| 제목 1 | 2rem (32px) | 700 | 1.2 |
| 제목 2 | 1.5rem (24px) | 600 | 1.3 |
| 제목 3 | 1.25rem (20px) | 600 | 1.4 |
| 본문 | 1rem (16px) | 400 | 1.5 |
| 보조 | 0.875rem (14px) | 400 | 1.5 |
| 캡션 | 0.75rem (12px) | 400 | 1.4 |

## 간격 (4px 스케일)
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

## 보더 반경
- 기본 8px
- 버튼 6px
- 카드 12px
- 입력 6px
- 다이얼로그 16px

## 그림자
- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 6px -1px rgba(0,0,0,0.08)`
- lg: `0 10px 15px -3px rgba(0,0,0,0.10)`

## 반응형 브레이크포인트
- 모바일: `~767px`
- 태블릿: `768~1023px`
- 데스크탑: `1024px~`
- 와이드: `1440px~`

## 터치 타겟
최소 44×44px (iOS HIG 기준).

## Z-index 스케일
- 기본 0
- dropdown 1000
- sticky 1100
- overlay 1200
- modal 1300
- popover 1400
- toast 1500

## 컴포넌트 초기 목록 (`packages/ui`)
Button / Input / Textarea / Select / Label / Card / Dialog / Sheet / Tabs / Table / Form / Toast / Badge / Alert / DropdownMenu / Calendar / TreeView

## 운영 원칙
- CVA로 variant 관리 — `class-variance-authority`
- 토큰은 CSS 변수로 — 다크모드 전환이 클래스 토글로 가능
- Tailwind preset은 `packages/config-tailwind`에서 공유
- Storybook MDX로 문서화 — 각 컴포넌트 상태 모두 스토리화
