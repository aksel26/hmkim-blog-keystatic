# CLAUDE.md

이 파일은 Claude Code가 프로젝트를 이해하는 데 필요한 컨텍스트를 제공합니다.

## 프로젝트 개요

pnpm + Turborepo 기반 모노레포. 기술 블로그와 AI 기반 포스트 자동 생성 시스템.

## 모노레포 구조

```
apps/
├── blog/         # Next.js 16 블로그 (Keystatic CMS, port 3000)
├── agent/        # LangChain 기반 AI 포스트 생성 CLI
└── agent-web/    # AI Agent 관리 웹 UI (port 3001)
supabase/
└── migrations/   # Supabase DB 마이그레이션
```

## 명령어

```bash
# 개발
pnpm dev              # 전체 앱 동시 실행
pnpm dev:blog         # 블로그만 (localhost:3000)
pnpm dev:agent-web    # Agent 웹 UI만 (localhost:3001)

# 빌드/린트
pnpm build            # 전체 빌드
pnpm lint             # 전체 린트

# AI 포스트 생성
pnpm generate-post    # 인터랙티브 CLI로 포스트 생성
```

## 앱별 핵심 정보

### apps/blog
- **CMS**: Keystatic (`/keystatic` 경로로 접근, 개발 환경에서만 Admin 버튼 표시)
- **콘텐츠**: `content/{tech,life,stock}/` 디렉토리에 `.mdoc` 파일
- **스타일**: Tailwind CSS v4, `globals.css`에 커스텀 테마 변수
- **DB 연동**: Supabase (구독자, 댓글, 조회수)

### apps/agent
- **AI**: LangChain + Gemini/Claude
- **워크플로우**: `ai-agents/workflows/` - 리서치 → 작성 → 검토 → 검증
- **에이전트**: researcher, writer, reviewer, validator

### apps/agent-web
- **UI**: React Query + React Hook Form + Zod
- **기능**: 포스트 생성 큐, 스케줄링, 이메일 템플릿 관리

## 환경변수

`.env.example` 참조. 주요 변수:
- `KEYSTATIC_STORAGE_KIND`: local (개발) / github (배포)
- `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`: AI 모델 API 키
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 연결

## 코드 컨벤션

- **커밋**: Conventional Commits (feat, fix, refactor, chore, docs)
- **스코프**: 모노레포 앱명 사용 - `feat(blog):`, `fix(agent-web):`
- **언어**: 커밋 메시지 한국어, 기술 용어는 영문 유지

## Gotchas

- `process.env.NODE_ENV === 'production'`으로 배포 환경 체크 (Admin 버튼 숨김 등)
- Keystatic은 개발 환경에서 로컬 파일시스템, 배포 시 GitHub 저장소 사용
- agent-web은 port 3001 사용 (blog와 충돌 방지)
- Supabase 마이그레이션은 `supabase/migrations/` 디렉토리에 순차 번호로 관리
