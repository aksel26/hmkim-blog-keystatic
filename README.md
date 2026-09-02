# hmkim-blog

기술 블로그와 AI 기반 포스트 자동 생성 시스템을 하나의 모노레포로 관리하는 개인 프로젝트.

블로그 글 작성부터 AI 에이전트를 활용한 리서치, 초안 생성, 검토, 검증까지의 워크플로우를 포함한다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | pnpm 10 + Turborepo |
| 블로그 | Next.js 16, React 19, Keystatic CMS, Tailwind CSS v4 |
| 데이터 | Supabase (댓글, 조회수, 구독자) |
| AI Agent | LangChain + LangGraph (StateGraph), Gemini 2.0 Flash |
| Agent 웹 UI | Next.js 16, React Query, React Hook Form, Zod |

## 프로젝트 구조

```
apps/
├── blog/         # Next.js 블로그 (port 3000)
├── agent/        # AI 포스트 생성 CLI
└── agent-web/    # Agent 관리 웹 UI (port 3001)
content/
├── tech/         # 기술 포스트 (.mdoc)
├── life/         # 일상 포스트 (.mdoc)
└── stock/        # 주식 포스트 (.mdoc)
supabase/
└── migrations/   # DB 마이그레이션
```

## 시작하기

### 사전 요구사항

- Node.js v22+
- pnpm 10.2.0

### 설치

```bash
pnpm install
```

### 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.example`을 참고하여 필요한 값을 채운다. 주요 항목:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **AI 모델**: `GOOGLE_API_KEY` (Gemini)
- **웹 검색**: `TAVILY_API_KEY`

### 개발 서버

```bash
# 전체 앱 동시 실행
pnpm dev

# 개별 실행
pnpm dev:blog         # 블로그 (localhost:3000)
pnpm dev:agent-web    # Agent 웹 UI (localhost:3001)
```

### AI 포스트 생성

```bash
pnpm generate-post
```

인터랙티브 CLI로 주제를 입력하면 리서치부터 PR 생성까지 8단계를 거친다. 중간의 사용자 검토에서 반려하면 피드백을 반영해 초안 작성부터 다시 돈다.

## 앱별 소개

### blog

Keystatic CMS 기반 기술 블로그. Markdoc(`.mdoc`) 형식으로 콘텐츠를 관리하며, Supabase로 댓글/조회수/뉴스레터 구독 기능을 제공한다.

- `/tech` - 기술 포스트
- `/life` - 일상 포스트
- `/me` - 소개 페이지
- `/subscribe` - 뉴스레터 구독
- `/keystatic` - CMS 관리 화면 (개발 환경 전용)

### agent

LangGraph `StateGraph`로 선언한 8노드 워크플로우. 모든 노드는 Gemini 2.0 Flash 하나를 사용한다 (`ai-agents/config/models.ts`).

```
research → write → review → create → thumbnail → validate → humanReview → deploy(PR)
             ▲                                                  │
             └──────────────── 반려 시 피드백 반영 ───────────────┘
```

사람이 개입하는 지점이 두 곳이다.

- **humanReview**: 검증 결과를 보고 승인 또는 반려. 반려하면 리서치 결과는 재사용하고 write부터 재실행한다.
- **deploy**: 블로그에 직접 게시하지 않는다. 브랜치를 만들고 PR을 올리며, 머지는 사람이 한다.

`validate`는 LLM 없이 결정론적 규칙(제목 길이, 태그 수, 코드블록 짝 등)만 검사한다. 내용 품질 판단은 humanReview로 넘긴다.

반려 시 리서치는 재사용하고 피드백을 소비하는 create부터 다시 돈다. 반려 상한은 3회다. 설계 근거는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)에 있다.

지금까지 이 파이프라인으로 나간 포스트는 전체  중 5편이다 (2026-01-23 ~ 02-13, PR #16·#25·#27·#29·#31).

### agent-web

Agent를 브라우저에서 돌리는 UI. 생성 작업을 Supabase `jobs` 테이블에 기록하고 진행 상황을 스트리밍한다.
사용자 검토와 배포 승인을 화면에서 처리하며, 트렌드 키워드 조회·뉴스레터 발송·구독자 관리·이메일 템플릿 기능이 있다.

## 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 파이프라인 설계와 판단 근거
- [docs/PRD.md](docs/PRD.md) - 제품 요구사항
- [docs/DESIGN.md](docs/DESIGN.md) - 디자인 가이드

## 빌드

```bash
pnpm build    # 전체 빌드
pnpm lint     # 전체 린트
pnpm --filter agent test   # 워크플로우 그래프 분기 테스트
```

## 배운 점

- Keystatic을 활용한 Git 기반 CMS 구축 방법
- LangChain/LangGraph로 멀티 에이전트 워크플로우 설계
- Turborepo 모노레포에서 여러 Next.js 앱을 효율적으로 관리하는 방법
- Supabase를 활용한 서버리스 백엔드 구성
