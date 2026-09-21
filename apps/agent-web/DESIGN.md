---
name: AI Agent
description: AI가 쓴 초안을 사람이 검토해 내보내는 블로그 편집 도구
colors:
  background: "oklch(1 0 0)"
  card: "oklch(1 0 0)"
  input: "oklch(0.86 0 0)"
  popover: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  muted-foreground: "oklch(0.44 0 0)"
  border: "oklch(0.9 0 0)"
  pencil: "oklch(0.145 0 0)"
  ring: "oklch(0.145 0 0)"
  success: "oklch(0.47 0.12 155)"
  warning: "oklch(0.55 0.14 55)"
  destructive: "oklch(0.52 0.2 27)"
  background-dark: "oklch(0.145 0 0)"
  card-dark: "oklch(0.145 0 0)"
  input-dark: "oklch(0.34 0 0)"
  popover-dark: "oklch(0.22 0 0)"
  foreground-dark: "oklch(0.985 0 0)"
  muted-foreground-dark: "oklch(0.7 0 0)"
  border-dark: "oklch(0.28 0 0)"
  pencil-dark: "oklch(0.985 0 0)"
  success-dark: "oklch(0.76 0.14 155)"
  warning-dark: "oklch(0.8 0.13 75)"
  destructive-dark: "oklch(0.7 0.18 25)"
typography:
  display:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  button:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  label:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
  data:
    fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0.025em"
    fontFeature: "'tnum'"
  code:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
  full: "9999px"
spacing:
  "1.5": "0.375rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "8": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "oklch(0.21 0.012 60 / 0.9)"
  button-tonal:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-tonal-hover:
    backgroundColor: "oklch(0.915 0.011 85 / 0.6)"
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-ghost-hover:
    backgroundColor: "{colors.input}"
  button-link:
    textColor: "{colors.pencil}"
    typography: "{typography.button}"
  button-destructive:
    backgroundColor: "oklch(0.52 0.2 27 / 0.1)"
    textColor: "{colors.destructive}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  badge-progress:
    backgroundColor: "oklch(0.46 0.17 258 / 0.1)"
    textColor: "{colors.pencil}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  badge-success:
    backgroundColor: "oklch(0.47 0.12 155 / 0.1)"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  badge-warning:
    backgroundColor: "oklch(0.55 0.14 55 / 0.1)"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  badge-destructive:
    backgroundColor: "oklch(0.52 0.2 27 / 0.1)"
    textColor: "{colors.destructive}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  badge-neutral:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  kpi-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.display}"
    rounded: "{rounded.lg}"
    padding: "0.875rem 1rem"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
  nav-item:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: "0.5rem"
    height: "2.25rem"
  nav-item-active:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
  list-row:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.75rem 0.5rem"
  list-row-hover:
    backgroundColor: "{colors.background}"
---

# Design System: AI Agent

`apps/agent-web`의 시각 체계다. 값의 기준은 `app/globals.css`의 CSS 변수와 `components/ui/`의 구현이고, 이 문서는 2026-09-21의 구현에서 뽑았고, 같은 날 색을 흑백 톤으로 바꾸면서 고쳤다. 저장소의 `docs/DESIGN.md`는 이 앱과 무관한 예전 생성 프롬프트이므로 따르지 않는다.

## Overview

**Creative North Star: "흑과 백"**

AI Agent는 AI가 쓴 초안을 사람이 읽고 고쳐서 내보내는 편집 도구다. 화면도 그 일을 닮았다. 흰 면 위에 먹색 글자가 놓인다. 색은 무채색만 쓰고, 사람의 눈이 가야 할 자리는 색이 아니라 굵기, 밑줄, 먹색으로 채운 면이 짚는다. 유채색은 상태를 알리는 세 가지뿐이다.

영역은 선으로도 면으로도 가두지 않는다. 카드, 사이드바, 입력창 모두 바탕과 같은 백색이고, 영역은 여백과 굵은 제목이 나눈다. 회색은 hover에서만 얕게 나타난다. 아이콘도 쓰지 않는다. 위계와 의미는 굵기, 크기, 색이 맡는다. 부품은 인쇄물처럼 단정하고 절제되어 있다. 눈에 들어오는 것은 부품이 아니라 내용이다.

밀도는 높다. 자리를 비웠다 돌아온 사람이 한 화면에서 여러 작업의 상태를 훑어야 하기 때문이다. 기본 shadcn 대시보드(회색 테두리 카드에 lucide 아이콘)와 여백 넓은 마케팅형 화면은 이 체계가 피하는 모습이다.

**Key Characteristics:**

- 바깥 박스 테두리도 회색 면도 없다. 여백과 제목으로 영역을 나눈다. 회색은 hover에만 쓴다.
- 아이콘이 없다. 텍스트 라벨, 번호, 글자 기호(→ ←)가 대신한다.
- 팔레트는 무채색이다. 강조도 먹색이고, 유채색은 상태색 세 가지뿐이다.
- 서체는 SUIT 하나다. 위계는 굵기와 크기로 만든다.
- 루트 글자 크기 87.5%의 높은 밀도를 쓴다.
- 라이트와 다크가 같은 규칙으로 동작한다.

## Colors

chroma 0의 무채색 팔레트다. 값은 OKLCH로 적고, frontmatter의 `-dark` 키가 다크 모드 값이다.

### Primary

- **강조의 먹** (`pencil`, oklch(0.145 0 0)): 링크, 현재 메뉴의 번호, 진행 중인 단계와 상태 배지, 진행 막대, 차트의 첫 번째 계열에 쓴다. 값은 본문 먹색과 같다. 토큰 이름 `pencil`은 예전 파란 색연필 시절의 이름을 그대로 둔 것이다. 색으로 구분되지 않으므로 링크는 밑줄을, 현재 위치와 진행 중은 굵기를 함께 쓴다. 포커스 링(`ring`)도 같은 먹색을 50% 농도로 쓴다.

### Secondary

의미를 전하는 상태색 세 가지다. 글자색이나 10% 농도의 면으로만 쓴다.

- **완료의 초록** (`success`, oklch(0.47 0.12 155)): 완료 상태, 통과한 검사, 80점 이상의 점수.
- **대기의 호박색** (`warning`, oklch(0.55 0.14 55)): 사람의 결정을 기다리는 상태(사용자 검토 대기, PR 승인 대기, 보류), 60점 이상 80점 미만의 점수, 부분 실패 알림.
- **실패의 빨강** (`destructive`, oklch(0.52 0.2 27)): 실패 상태, 오류 문구, 삭제 같은 되돌릴 수 없는 액션.

### Neutral

- **백** (`background`, `card`, `sidebar`, oklch(1 0 0)): 페이지 바탕이자 카드와 사이드바의 색. 면의 톤 차이를 두지 않는다. 사이드바의 현재 메뉴와 카드 안 목록 행의 hover도 이 색으로 밝아진다.
- **hover의 얕은 회색** (`accent`, oklch(0.96 0 0)): 목록 행, 메뉴, ghost·톤 버튼, 선택 칩의 hover에만 쓴다. 가만히 있는 화면에는 나타나지 않는다. 코드의 `secondary`, `muted`도 같은 값이고 스켈레톤 같은 임시 자리에만 남아 있다.
- **입력창의 선** (`input`, oklch(0.86 0 0)): 입력창, select, textarea의 1px 선(`border-input`). 채움이 아니다.
- **먹** (`foreground`, oklch(0.145 0 0)): 본문 글자와 주요 버튼의 바탕. 코드의 `primary`도 같은 값이다.
- **옅은 먹** (`muted-foreground`, oklch(0.44 0 0)): 보조 설명, 라벨, 대기 중인 단계.
- **구분선** (`border`, oklch(0.9 0 0)): 목록 행 사이에만 쓴다. 70% 불투명도(`divide-border/70`)로 옅게 긋는다.
- **떠 있는 백** (`popover`, oklch(1 0 0)): 팝오버, 드롭다운, 다이얼로그처럼 떠 있는 레이어의 바탕. 바탕과 같은 백색이라 경계는 그림자의 1px 링이 만든다.

### Named Rules

**무채색 규칙.** 면과 글자에는 chroma 0인 값만 쓴다. 따뜻하거나 푸른 기가 도는 회색(slate, zinc, stone)을 섞지 않는다. 미리보기 본문도 `prose-neutral`을 쓴다. 차트는 색상이 아니라 명도 단계(`--chart-1`이 가장 진하다)로 계열을 나눈다.

**강조는 형태로 하는 규칙.** `pencil`은 링크, 현재 위치, 진행 중 세 가지에만 쓴다. 본문과 같은 먹색이므로 링크에는 밑줄, 현재 위치와 진행 중에는 굵은 글씨를 함께 쓴다.

**옅은 면 규칙.** 상태는 그 색을 10% 농도로 깐 면 위에 같은 색 글자로 표시한다. 색을 꽉 채운 배지나 버튼은 만들지 않는다. 꽉 채운 면은 먹색 주요 버튼 하나뿐이다.

**토큰만 쓰는 규칙.** `text-red-500` 같은 Tailwind 기본 팔레트를 직접 쓰지 않는다. 차트도 `--chart-1`부터 `--chart-5`까지의 변수를 쓴다. 그래야 다크 모드가 따라온다.

## Typography

**Display Font:** SUIT Variable (fallback: -apple-system, Apple SD Gothic Neo, sans-serif)
**Body Font:** SUIT Variable
**Label/Mono Font:** SUIT Variable. 코드 편집 영역과 `<code>`만 시스템 monospace(ui-monospace, SF Mono, Menlo)를 쓴다.

**Character:** SUIT는 획이 고르고 중립적인 한글 산세리프다. 제목, 숫자, 본문, 라벨을 모두 이 서체 하나로 쓴다. 개성은 서체가 아니라 흑백의 대비와 굵기 대비가 만든다. `app/layout.tsx`에서 `next/font/local`로 불러오고, 파일과 SIL OFL 라이선스는 `app/fonts/`에 있다.

### Hierarchy

크기는 rem이 기준이다. 루트가 87.5%라서 1rem은 14px이다.

- **Display** (700, 2.25rem, line-height 1, `tabular-nums`): KPI 숫자. 색으로 의미를 입힌다. SEO 점수 같은 작은 점수는 1.875rem으로 쓴다.
- **Headline** (700, 1.875rem, 1.2): 페이지 제목. `PageHeader`가 그린다.
- **Title** (700, 1.125rem, 1.25): 카드 제목과 블록 제목. `CardTitle`의 기본값이다.
- **Body** (400, 1rem, 1.5): 본문. 목록 행의 제목은 같은 크기에 600을 쓴다.
- **Body small** (400, 0.875rem): 설명, 폼 입력, 버튼(500).
- **Label** (600, 0.75rem): KPI 제목, 섹션 라벨, 배지, 표 머리글. 옅은 먹으로 쓴다.
- **Data** (400, 0.75rem, letter-spacing 0.025em): 대문자 카테고리(`TECH`, `LIFE`)와 템플릿 이름, 메뉴와 단계의 번호(`01`, `02`), 퍼센트.
- **Code** (시스템 monospace, 0.875rem): HTML과 마크다운을 편집하는 textarea, 파일 경로, 커밋 해시, slug.

### Named Rules

**서체는 하나 규칙.** 제목, 숫자, 본문, 라벨을 모두 SUIT로 쓴다. 위계는 굵기(400, 500, 600, 700)와 크기로 만든다. 두 번째 서체를 들이지 않는다. 코드 편집 영역과 `<code>`의 시스템 monospace만 예외다.

**고정폭 숫자는 정렬이 필요한 곳에만 규칙.** `tabular-nums`는 번호, 퍼센트, KPI, 점수처럼 자릿수가 맞아야 하거나 값이 바뀌는 숫자에 쓴다. "오후 11:11" 같은 문장 속 시각에는 쓰지 않는다. SUIT의 고정폭 1은 간격이 벌어져 보인다.

## Layout

앱 셸은 왼쪽 사이드바(16rem)와 본문으로 이루어진다. 헤더는 높이 2.5rem이고 아래 테두리가 없다. 본문은 좌우와 아래에 1rem의 여백을 두고, 본문 영역만 세로로 스크롤된다.

밀도는 `html { font-size: 87.5% }` 한 줄이 만든다. rem 기반의 글자와 간격이 함께 줄어든다. 미디어쿼리의 rem은 영향을 받지 않아 breakpoint는 그대로다. 글자 크기를 조정할 때는 개별 클래스를 고치지 않고 이 값을 바꾼다.

간격의 기준은 1rem이다. 섹션 사이와 격자 간격이 1rem, 카드 안쪽 여백이 1rem, KPI 격자 간격이 0.75rem, 목록 행의 세로 여백이 0.75rem이다. 빈 상태만 세로 2rem 이상의 여백을 갖는다.

격자는 화면마다 다르다. KPI는 2열에서 lg(1024px)부터 4열이 된다. 대시보드 본문은 2:1, 작업 상세는 2:3, 생성 폼은 3:2로 나뉘고, lg 아래에서는 한 열로 쌓인다.

md(768px) 아래에서 사이드바는 Sheet로 열리고, 메뉴를 고르면 닫힌다. 데스크톱에서는 헤더의 "메뉴" 버튼이나 Cmd/Ctrl+B로 완전히 접는다. 접힘 상태는 쿠키로 유지된다.

한글은 어절 단위로 줄을 바꾼다(`word-break: keep-all`).

## Elevation & Depth

페이지에 붙은 것에는 층이 없다. 모두 같은 백색 위에 놓이고 여백이 나눈다. 목록 행은 hover에서 얕은 회색(`accent`)으로 짙어진다. 채움 없이 형태를 잡아야 하는 작은 부품(톤 버튼, 선택 칩, 중립 배지)은 1px 링 그림자(`shadow-border`)를 쓴다.

### Shadow Vocabulary

- **형태를 잡는 링** (`shadow-border`, `--elevation-border`): 톤 버튼(outline, secondary), 선택 안 된 칩, 중립 배지. `0 0 0 1px rgb(0 0 0 / 0.1)`에 아주 얕은 그림자 하나. 다크는 흰 링 하나다.
- **떠 있는 레이어** (`shadow-float`, `--elevation-float`): 팝오버, 드롭다운, select 목록. 1px 링(`0 0 0 1px rgb(0 0 0 / 0.06)`), 가까운 그림자, 먼 그림자 세 겹이다. 백색 면이 백색 바탕 위에 뜨기 때문에 링이 경계를 만든다.
- **화면을 덮는 레이어** (`shadow-modal`, `--elevation-modal`): 다이얼로그, 확인 창, 모바일 사이드바 Sheet. 같은 세 겹에 먼 그림자가 더 깊다.
- 다크 모드에서는 겹친 그림자가 보이지 않아 흰 링(`rgb(255 255 255 / 0.1)`) 하나와 깊은 그림자 하나로 줄인다.

### Named Rules

**떠 있는 것만 그림자 규칙.** 페이지에 붙어 있는 면에는 그림자를 주지 않는다. 그림자는 페이지 위에 떠서 다른 내용을 가리는 레이어에만 쓴다. 이 레이어들은 테두리 대신 그림자로 구분된다.

## Shapes

모서리는 작게 둥글린다. 카드와 큰 블록은 0.5rem(7px), 버튼과 입력창은 그보다 2px 작게(5px), 배지는 4px 작게(3px) 둥글린다. 완전히 둥근 것은 진행 막대뿐이다. 알약 모양 배지는 쓰지 않는다. 배지는 도장처럼 각이 살아 있다.

바깥 테두리는 없다. 선은 목록 행 사이의 1px 구분선뿐이다. 폼 컨트롤에는 예외가 둘 있다. 체크박스와 라디오는 채움 면 위에서도 보이도록 옅은 먹 50%의 1px 테두리를 갖는다. 포커스된 컨트롤은 3px 링으로 표시한다.

## Components

부품은 인쇄물처럼 단정하고 절제되어 있다. 면과 글자만으로 이루어지고 장식이 없다.

### Buttons

모든 버튼은 누르는 동안 `scale(0.96)`으로 줄어든다(`static` prop으로 끈다. Link 변형은 줄어들지 않는다). 밀도 때문에 보이는 높이는 25~32px이지만 `::after`로 클릭 영역을 40px까지 넓혔다. 체크박스, 라디오, 스위치도 같다. 넓힌 영역끼리 겹치면 안 된다.

- **Shape:** 작게 둥근 모서리(5px), 높이 2.25rem, 좌우 여백 1rem. `sm`은 2rem, `lg`는 2.5rem이다.
- **Primary:** 먹색 바탕에 백색 글자. 화면에서 유일하게 색을 꽉 채운 면이다. hover에서 90% 농도로 옅어진다.
- **Tonal (코드의 `outline`):** 채움 바탕에 먹색 글자. 테두리가 없다. hover에서 60% 농도가 된다.
- **Ghost:** 바탕이 없다가 hover에서 채움색이 깔린다. 헤더의 "메뉴"와 테마 전환, 목록의 행별 액션에 쓴다.
- **Link:** 먹색 글자에 옅은 밑줄이 기본으로 있고 hover에서 밑줄이 진해진다. "전체 보기 →"처럼 글자 화살표를 붙여 쓴다. SUIT는 화살표 글리프를 꺾쇠 모양으로 그린다.
- **Destructive:** 빨강 10% 면에 빨간 글자.
- **진행 중:** 스피너를 쓰지 않는다. 라벨을 "저장 중…", "PR 생성 중…"으로 바꾸고 비활성화한다.

### Chips

- **Style:** 상태 배지. 각진 모서리(3px), 0.75rem 굵은 글자, 색 10% 면에 같은 색 글자. 테두리가 없다.
- **State:** 진행 중은 먹색 10% 면에 먹색 글자, 완료는 초록, 사람을 기다리는 상태는 호박색, 실패는 빨강, 대기는 채움색에 먹색 글자다. `getStatusBadgeVariant`가 작업 상태를 이 다섯 가지로 나눈다.
- 말투나 카테고리를 고르는 토글 칩은 같은 모양에 선택되면 먹색 바탕이 된다.

### Cards / Containers

- **Corner Style:** 0.5rem(7px).
- **Background:** 바탕과 같은 백색이고 좌우 안쪽 여백이 없다. 내용이 페이지 제목과 같은 선에서 시작한다. 사람의 결정이 필요한 패널은 호박색 10% 면, 완료 안내는 초록 10% 면, 오류 안내는 빨강 10% 면을 쓰고 제목도 같은 색으로 쓴다.
- **Shadow Strategy:** 없음. Elevation & Depth를 따른다.
- **Border:** 없음.
- **Internal Padding:** 위아래와 좌우 1rem. 제목과 내용 사이도 1rem.

### Inputs / Fields

- **Style:** 채움 바탕, 테두리 없음, 5px 모서리, 높이 2.25rem. 텍스트 입력, textarea, select가 모두 같다. 검색 입력은 아이콘 없이 placeholder로 용도를 알린다.
- **Focus:** 먹색 50% 농도의 3px 링.
- **Error / Disabled:** 오류는 빨간 링과 빨간 도움말 글자. 비활성은 50% 불투명도.

### Navigation

- 사이드바는 본문과 같은 백색이고 테두리가 없다. 맨 위에 굵은 워드마크가 놓인다.
- 메뉴 항목은 번호와 이름으로 이루어진다. 기본은 옅은 먹이고 번호는 더 옅다.
- 현재 메뉴는 면 없이 굵은 먹색 이름과 먹색 번호로 표시한다. hover에서만 얕은 회색이 깔린다.

### KPI 숫자 블록

면 없이 작은 라벨, 크고 굵은 숫자, 설명 한 줄이 놓인다. 숫자의 색이 의미를 전한다. 완료는 초록, 대기가 있으면 호박색, 실패가 있으면 빨강, 비율은 먹색이다. `KPIStatCard`의 `tone`으로 지정한다.

### 가로 단계 노드

작업 진행 상황은 작업 상세 화면 맨 위에 가로로 놓인 노드 9개로 보여 준다(`components/job/JobProgress.tsx`). 번호가 든 1.5rem 원을 1px 선으로 잇는다. 완료는 먹색으로 채운 원에 백색 번호이고 다음 노드까지의 선도 먹색으로 찬다. 진행 중은 먹색 링에 맥박 애니메이션, 오류는 빨간 링과 빨간 라벨, 대기는 가는 링에 옅은 번호다. 아이콘(체크 표시)은 쓰지 않는다.

노드 아래 한 줄에 단계 이름과 최근 로그 세 줄이 나온다. 기본은 진행을 따라가고(오류 단계, 없으면 현재 단계), 끝난 노드를 누르면 그 단계의 로그로 바뀐다. 사람의 결정이 필요한 때의 버튼(승인, PR 생성, 반려)도 이 줄 오른쪽에 놓인다. 노드의 보이는 크기는 작지만 클릭 영역은 40px이다. 폭이 40rem보다 좁으면 노드 줄만 가로로 스크롤한다.

그 아래는 좌우 분할이다(`components/shared/ResizableSplit.tsx`). 기본은 본문 미리보기 70%, 메타데이터(와 SEO 탭) 30%이고, 가운데 손잡이를 끌어 35~80% 사이에서 바꾼다. 손잡이는 평소에 옅은 짧은 선이고 올리거나 끌면 먹색으로 길어진다. ←/→, Home/End, 더블클릭(기본값)도 받는다. 놓은 위치는 브라우저에 기억된다. `lg` 미만에서는 위아래로 쌓이고 손잡이가 숨는다.

### 목록 행

카드 안의 목록은 박스가 아니라 구분선으로 나뉜 행이다. 굵은 제목과 상태 배지가 첫 줄에, 대문자 카테고리와 시각이 둘째 줄에 놓인다. 진행 중인 작업은 아래에 0.25rem 두께의 가는 진행 막대를 단다. hover에서 행 전체가 얕은 회색으로 짙어진다(좌우로 0.5rem 번진다).

## Do's and Don'ts

### Do:

- **Do** 영역을 여백과 굵은 제목으로 나눈다. 목록은 행 사이 구분선으로 나눈다.
- **Do** 아이콘이 필요해 보이는 자리에 텍스트 라벨, 번호(`01`), 글자 기호(→ ←)를 쓴다.
- **Do** 상태를 색 10% 면과 같은 색 글자로 표시한다.
- **Do** 페이지 제목은 `PageHeader`, 큰 숫자는 `KPIStatCard`, 빈 화면은 `EmptyState`, 로딩은 `LoadingText`를 쓴다.
- **Do** 색은 CSS 변수 토큰으로만 쓴다. 차트는 `--chart-1`부터 `--chart-5`까지를 쓴다.
- **Do** 위계는 SUIT의 굵기와 크기로 만든다. 제목과 큰 숫자는 700, 목록 행 제목과 라벨은 600, 버튼은 500, 본문은 400이다.
- **Do** 새 화면도 라이트와 다크 양쪽에서 확인한다.

### Don't:

- **Don't** 카드, 패널, 입력창, 알림에 바깥 테두리를 두지 않는다. 선은 목록 행 사이의 구분선뿐이다.
- **Don't** 아이콘을 쓰지 않는다. 체크박스의 체크 표시와 select의 화살표 같은 폼 컨트롤 글리프만 예외다.
- **Don't** 기본 shadcn 대시보드(회색 테두리 카드에 lucide 아이콘)로 돌아가지 않는다.
- **Don't** 여백 넓은 마케팅형 화면을 만들지 않는다. 큰 여백과 큰 글자로 한 화면의 정보를 줄이지 않는다.
- **Don't** 회색 면을 깔지 않는다(`bg-muted`, `bg-secondary`, `bg-card`로 영역을 칠하지 않는다). 회색은 hover(`hover:bg-accent`)와 진행 막대의 트랙에만 쓴다.
- **Don't** 면과 글자에 유채색이나 색 기가 도는 회색을 쓰지 않는다. 유채색은 상태색 세 가지뿐이다.
- **Don't** `transition-all`을 쓰지 않는다. 바뀌는 속성만 적는다 (`transition-[color,background-color,box-shadow,scale]`).
- **Don't** 페이지에 붙어 있는 면에 그림자를 주지 않는다.
- **Don't** 두 번째 서체를 들이지 않는다. 코드 편집 영역과 `<code>`의 시스템 monospace만 예외다.
- **Don't** 문장 속 시각에 `tabular-nums`를 걸지 않는다.
- **Don't** `text-${tone}`처럼 Tailwind 클래스 이름을 조립하지 않는다. 완성된 이름을 그대로 써야 빌드에 포함된다.
