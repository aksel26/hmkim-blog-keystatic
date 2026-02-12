# hmkim-blog

기술 블로그와 AI 기반 포스트 자동 생성 시스템을 하나의 모노레포로 관리하는 개인 프로젝트.

블로그 글 작성부터 AI 에이전트를 활용한 리서치, 초안 생성, 검토, 검증까지의 워크플로우를 포함한다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | pnpm 10 + Turborepo |
| 블로그 | Next.js 16, React 19, Keystatic CMS, Tailwind CSS v4 |
| 데이터 | Supabase (댓글, 조회수, 구독자) |
| AI Agent | LangChain + LangGraph, Claude, Gemini |
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
- **AI 모델**: `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`
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

인터랙티브 CLI로 주제 선택 → AI 리서치 → 초안 작성 → 검토 → 검증 과정을 거쳐 포스트를 생성한다.

## 앱별 소개

### blog

Keystatic CMS 기반 기술 블로그. Markdoc(`.mdoc`) 형식으로 콘텐츠를 관리하며, Supabase로 댓글/조회수/뉴스레터 구독 기능을 제공한다.

- `/tech` - 기술 포스트
- `/life` - 일상 포스트
- `/me` - 소개 페이지
- `/subscribe` - 뉴스레터 구독
- `/keystatic` - CMS 관리 화면 (개발 환경 전용)

### agent

LangChain + LangGraph 기반 AI 포스트 생성 CLI. Researcher → Writer → Reviewer → Validator 에이전트가 순차적으로 동작하여 블로그 포스트를 자동 생성한다.

### agent-web

Agent의 웹 UI 버전. 포스트 생성 큐 관리, 스케줄링, 이메일 템플릿 관리 등의 기능을 제공한다.

## 빌드

```bash
pnpm build    # 전체 빌드
pnpm lint     # 전체 린트
```

## 배운 점

- Keystatic을 활용한 Git 기반 CMS 구축 방법
- LangChain/LangGraph로 멀티 에이전트 워크플로우 설계
- Turborepo 모노레포에서 여러 Next.js 앱을 효율적으로 관리하는 방법
- Supabase를 활용한 서버리스 백엔드 구성
