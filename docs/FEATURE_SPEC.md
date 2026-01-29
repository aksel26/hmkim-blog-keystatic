# 기능 명세서 (Technical Specification)

> 작성일: 2026-01-22
> 버전: 1.0.0

---

## 목차

1. [개요](#1-개요)
2. [구독 시스템 (Subscription System)](#2-구독-시스템-subscription-system)
3. [이메일 자동화 (Email Automation)](#3-이메일-자동화-email-automation)
4. [자동 포스팅 스케줄러 (Auto-Posting Scheduler)](#4-자동-포스팅-스케줄러-auto-posting-scheduler)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [API 명세](#6-api-명세)
7. [환경변수](#7-환경변수)

---

## 1. 개요

### 1.1 시스템 구성

| 앱 | 역할 | 기술 스택 |
|---|---|---|
| `apps/blog` | 블로그 프론트엔드, 구독 신청 | Next.js, Keystatic, Tailwind CSS |
| `apps/agent-web` | 관리자 대시보드, API 서버 | Next.js, Supabase, Resend |

### 1.2 주요 기능

- **구독 시스템**: 블로그 방문자 구독 신청 및 관리
- **이메일 자동화**: PR merge 시 자동 뉴스레터 발송
- **자동 포스팅**: 스케줄 기반 블로그 포스트 자동 생성

---

## 2. 구독 시스템 (Subscription System)

### 2.1 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   apps/blog     │────▶│    Supabase     │◀────│  apps/agent-web │
│  (구독 신청)     │     │   (Database)    │     │   (관리자)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 구독 플로우 (apps/blog)

```
사용자 ─▶ /subscribe (폼 입력) ─▶ POST /api/subscribe ─▶ /subscribe/complete
                                         │
                                         ▼
                                   Supabase DB
```

### 2.3 파일 구조

#### apps/blog
```
apps/blog/
├── app/
│   ├── subscribe/
│   │   ├── page.tsx              # 구독 신청 페이지
│   │   ├── complete/page.tsx     # 완료 페이지 (canvas-confetti)
│   │   ├── unsubscribed/page.tsx # 구독 해지 완료
│   │   └── error/page.tsx        # 에러 페이지
│   └── api/
│       ├── subscribe/route.ts    # POST: 구독 신청
│       └── unsubscribe/route.ts  # GET: 구독 해지
├── components/subscribe/
│   ├── SubscribeForm.tsx         # 구독 폼
│   ├── PrivacyModal.tsx          # 개인정보 동의 모달
│   ├── SubscribeButton.tsx       # 구독 버튼
│   └── index.ts
└── lib/supabase/
    ├── client.ts                 # Supabase 클라이언트
    └── schema.ts                 # 타입 정의
```

#### apps/agent-web (구독자 관리)
```
apps/agent-web/
├── app/
│   ├── subscribers/page.tsx      # 구독자 목록
│   └── api/subscribers/
│       ├── route.ts              # GET: 목록
│       ├── [id]/route.ts         # GET/PUT/DELETE
│       └── stats/route.ts        # 통계
└── lib/subscribers/
    ├── types.ts
    └── manager.ts                # CRUD 로직
```

### 2.4 구독 상태

| 상태 | 설명 |
|---|---|
| `active` | 활성 구독자 |
| `unsubscribed` | 구독 해지 |

---

## 3. 이메일 자동화 (Email Automation)

### 3.1 아키텍처

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ GitHub PR    │────▶│   Actions    │────▶│  agent-web   │────▶│    Resend    │
│   (merge)    │     │  Workflow    │     │  API Server  │     │  (이메일)     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
                                          ┌──────────────┐
                                          │   Supabase   │
                                          │ (구독자 조회) │
                                          └──────────────┘
```

### 3.2 트리거 조건

- `main` 브랜치에 PR merge
- 변경 파일: `apps/blog/content/**/*.mdoc`

### 3.3 파일 구조

```
.github/workflows/
└── newsletter.yml               # GitHub Actions 워크플로우

apps/agent-web/
├── app/api/newsletter/
│   └── send/route.ts            # POST: 뉴스레터 발송 API
└── lib/email/
    ├── types.ts                 # 이메일 관련 타입
    └── sender.ts                # Resend 연동 발송 로직
```

### 3.4 이메일 템플릿 변수

| 변수 | 설명 | 예시 |
|---|---|---|
| `{{blog_name}}` | 블로그 이름 | HM Blog |
| `{{post_title}}` | 포스트 제목 | React 19 새 기능 |
| `{{post_summary}}` | 포스트 요약 | ... |
| `{{post_url}}` | 포스트 URL | https://... |
| `{{subscriber_name}}` | 구독자 이름 | 홍길동 |
| `{{unsubscribe_url}}` | 구독 해지 URL | https://... |

### 3.5 GitHub Actions 워크플로우

```yaml
name: Send Newsletter on New Post

on:
  pull_request:
    types: [closed]
    branches: [main]
    paths:
      - 'apps/blog/content/**/*.mdoc'

jobs:
  send-newsletter:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      # 1. 체크아웃
      # 2. 변경된 mdoc 파일 감지
      # 3. frontmatter에서 title/summary 추출
      # 4. agent-web API 호출하여 이메일 발송
```

---

## 4. 자동 포스팅 스케줄러 (Auto-Posting Scheduler)

### 4.1 아키텍처

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Vercel Cron  │────▶│  /api/cron   │────▶│  Job Queue   │
│ (15분 간격)   │     │  (스케줄 확인) │     │  (작업 실행)  │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                     ┌──────────────┐
                     │   Supabase   │
                     │  (schedules) │
                     └──────────────┘
```

### 4.2 파일 구조

```
apps/agent-web/
├── vercel.json                  # Vercel Cron 설정
├── app/
│   ├── schedules/
│   │   ├── page.tsx             # 스케줄 목록
│   │   ├── new/page.tsx         # 새 스케줄 생성
│   │   └── [id]/edit/page.tsx   # 스케줄 편집
│   └── api/
│       ├── cron/route.ts        # Cron 실행 엔드포인트
│       └── schedules/
│           ├── route.ts         # GET/POST
│           ├── [id]/route.ts    # GET/PUT/DELETE
│           └── stats/route.ts   # 통계
└── lib/scheduler/
    ├── types.ts                 # 스케줄 타입 정의
    └── manager.ts               # CRUD 및 실행 로직
```

### 4.3 스케줄 설정 옵션

| 필드 | 타입 | 설명 |
|---|---|---|
| `name` | string | 스케줄 이름 |
| `description` | string? | 설명 |
| `topic_source` | enum | `manual`, `rss`, `ai_suggest` |
| `topic_list` | string[]? | 수동 토픽 목록 |
| `rss_url` | string? | RSS 피드 URL |
| `ai_prompt` | string? | AI 토픽 생성 프롬프트 |
| `category` | enum | `tech`, `life` |
| `template` | string | 포스트 템플릿 |
| `target_reader` | string? | 타겟 독자 |
| `keywords` | string[]? | 키워드 목록 |
| `auto_approve` | boolean | 자동 승인 여부 |
| `cron_expression` | string | 크론 표현식 |
| `timezone` | string | 타임존 (기본: Asia/Seoul) |
| `enabled` | boolean | 활성화 상태 |

### 4.4 크론 표현식 예시

| 표현식 | 설명 |
|---|---|
| `0 9 * * *` | 매일 오전 9시 |
| `0 9 * * 1` | 매주 월요일 오전 9시 |
| `0 10 1 * *` | 매월 1일 오전 10시 |

### 4.5 Vercel Cron 설정

```json
// apps/agent-web/vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 5. 데이터베이스 스키마

### 5.1 subscribers 테이블

```sql
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  privacy_agreed_at TIMESTAMPTZ NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 email_templates 테이블

```sql
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 schedules 테이블

```sql
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- 토픽 설정
  topic_source TEXT DEFAULT 'manual' CHECK (topic_source IN ('manual', 'rss', 'ai_suggest')),
  topic_list TEXT[],
  topic_index INTEGER DEFAULT 0,
  rss_url TEXT,
  ai_prompt TEXT,

  -- 작업 설정
  category TEXT DEFAULT 'tech' CHECK (category IN ('tech', 'life')),
  template TEXT DEFAULT 'default',
  target_reader TEXT,
  keywords TEXT[],
  auto_approve BOOLEAN DEFAULT false,

  -- 스케줄 설정
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',
  enabled BOOLEAN DEFAULT true,

  -- 실행 기록
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_job_id UUID,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 마이그레이션 파일

| 파일 | 설명 |
|---|---|
| `supabase/migrations/001_subscribers_and_templates.sql` | 구독자, 템플릿 테이블 |
| `supabase/migrations/002_schedules_table.sql` | 스케줄 테이블 |

---

## 6. API 명세

### 6.1 구독 API (apps/blog)

#### POST /api/subscribe
구독 신청

```typescript
// Request
{
  name: string;
  email: string;
  privacyAgreed: boolean;
}

// Response 200
{ success: true }

// Response 400
{ success: false, error: "이미 구독 중인 이메일입니다." }
```

#### GET /api/unsubscribe
구독 해지 (이메일 링크용)

```
GET /api/unsubscribe?email=user@example.com
→ Redirect to /subscribe/unsubscribed
```

### 6.2 구독자 관리 API (apps/agent-web)

#### GET /api/subscribers
구독자 목록 조회

```typescript
// Query params
page?: number;
limit?: number;
status?: 'active' | 'unsubscribed';
search?: string;

// Response
{
  subscribers: Subscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/subscribers/stats
구독자 통계

```typescript
// Response
{
  total: number;
  active: number;
  unsubscribed: number;
}
```

### 6.3 템플릿 API (apps/agent-web)

#### GET /api/templates
템플릿 목록

#### POST /api/templates
템플릿 생성

```typescript
// Request
{
  name: string;
  subject: string;
  body: string;
  is_default?: boolean;
}
```

#### PUT /api/templates/:id
템플릿 수정

#### DELETE /api/templates/:id
템플릿 삭제

### 6.4 뉴스레터 API (apps/agent-web)

#### POST /api/newsletter/send
뉴스레터 발송

```typescript
// Headers
Authorization: Bearer <NEWSLETTER_API_KEY>

// Request
{
  postTitle: string;
  postSummary: string;
  postUrl: string;
  postCategory?: string;
  test?: boolean;      // 테스트 모드
  testEmail?: string;  // 테스트 수신자
}

// Response
{
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}
```

### 6.5 스케줄 API (apps/agent-web)

#### GET /api/schedules
스케줄 목록

```typescript
// Query params
page?: number;
limit?: number;
enabled?: boolean;

// Response
{
  schedules: Schedule[];
  pagination: { ... };
}
```

#### POST /api/schedules
스케줄 생성

```typescript
// Request
{
  name: string;
  description?: string;
  topic_source?: 'manual' | 'rss' | 'ai_suggest';
  topic_list?: string[];
  category?: 'tech' | 'life';
  template?: string;
  cron_expression: string;
  timezone?: string;
  enabled?: boolean;
  // ... 기타 필드
}
```

#### GET /api/schedules/:id
스케줄 상세

#### PUT /api/schedules/:id
스케줄 수정

#### DELETE /api/schedules/:id
스케줄 삭제

#### GET /api/schedules/stats
스케줄 통계

```typescript
// Response
{
  total: number;
  enabled: number;
  disabled: number;
  totalRuns: number;
  totalErrors: number;
}
```

### 6.6 Cron API (apps/agent-web)

#### GET /api/cron
스케줄 실행 (Vercel Cron 전용)

```typescript
// Headers
Authorization: Bearer <CRON_SECRET>

// Response
{
  message: string;
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    scheduleId: string;
    scheduleName: string;
    jobId?: string;
    success: boolean;
    error?: string;
  }>;
}
```

---

## 7. 환경변수

### 7.1 apps/blog

| 변수 | 설명 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | O |

### 7.2 apps/agent-web

| 변수 | 설명 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | O |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | O |
| `RESEND_API_KEY` | Resend API 키 | O |
| `RESEND_FROM_EMAIL` | 발신 이메일 주소 | - |
| `NEWSLETTER_API_KEY` | 뉴스레터 API 인증 키 | O |
| `CRON_SECRET` | Vercel Cron 인증 시크릿 | O |
| `NEXT_PUBLIC_BLOG_URL` | 블로그 URL | - |

### 7.3 GitHub Secrets

| 변수 | 설명 |
|---|---|
| `NEWSLETTER_API_KEY` | 뉴스레터 API 인증 키 |

### 7.4 GitHub Variables

| 변수 | 설명 |
|---|---|
| `AGENT_WEB_URL` | agent-web 배포 URL |
| `BLOG_URL` | 블로그 배포 URL |

---

## 부록: 설정 링크

| 서비스 | 설정 위치 |
|---|---|
| Vercel 환경변수 | https://vercel.com → Project → Settings → Environment Variables |
| Resend API 키 | https://resend.com/api-keys |
| Supabase | https://supabase.com/dashboard |
| GitHub Secrets | Repository → Settings → Secrets and variables → Actions |
