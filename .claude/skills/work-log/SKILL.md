---
name: dev-log-from-commits
description: Git 커밋 내역을 분석하여 Obsidian 형식의 개발 기록 마크다운 자동 생성. "오늘 커밋 정리", "개발 기록 작성", "커밋 분석", "작업 로그" 요청 시 트리거. 커밋 메시지, 변경 파일, diff를 분석하여 frontmatter 메타데이터와 기술 개념 설명이 포함된 체계적인 문서 생성 후 Obsidian MCP로 저장.
---

# Dev Log From Commits

Git 커밋 내역을 분석하여 개발 기록을 자동 생성하고 Obsidian vault에 저장.

## Workflow

### 1. 커밋 내역 수집

```bash
# 오늘 커밋 조회
git log --since="00:00" --pretty=format:"%h|%s|%an|%ai" --name-status

# 특정 날짜 커밋
git log --since="2025-01-29 00:00" --until="2025-01-29 23:59" --pretty=format:"%h|%s" --name-status

# 최근 N개 커밋
git log -n 10 --pretty=format:"%h|%s" --name-status
```

### 2. 커밋 그룹핑

관련 커밋을 하나의 개발 기록으로 묶음:
- 동일 feature branch 커밋
- 연속된 같은 주제 커밋 (feat, fix 접두사 기준)
- Merge 커밋은 별도 처리

그룹핑 기준:
```
feat(blog): 댓글 시스템 구현
feat(blog): 댓글 수정 기능
feat(blog): 댓글 삭제 기능
→ 하나의 "블로그 댓글 시스템 구현" 기록으로 통합
```

### 3. 커밋 메시지 분석

Conventional Commits 형식 파싱:
```
type(scope): description

type → 문서 type 필드
scope → 프로젝트/카테고리 힌트
description → 제목/설명
```

| Commit Type | Document Type |
|-------------|---------------|
| feat | Feature |
| fix | Bug Fix |
| refactor | Refactor |
| docs | Documentation |
| chore, ci | Config |
| style | Feature |
| perf | Feature |

### 4. 변경 파일 분석

```bash
# 커밋별 변경 파일 및 통계
git show --stat --name-status {hash}

# 상세 diff (기술 개념 추출용)
git show {hash} -- "*.ts" "*.tsx"
```

파일 경로에서 정보 추출:
- `apps/admin/*` → Meal ACG Admin
- `apps/user/*` → Meal ACG User  
- `apps/blog/*` → Blog
- `components/*` → Frontend
- `api/*`, `lib/*` → Backend
- `.github/*` → DevOps

### 5. 기술 개념 자동 감지

diff 내용에서 키워드 감지 후 설명 생성:

| 감지 패턴 | 설명할 개념 |
|-----------|-------------|
| `bcrypt`, `hash` | 비밀번호 해시 |
| `supabase.rpc` | Supabase RPC 함수 |
| `AnimatePresence` | Framer Motion 애니메이션 |
| `useRef`, `useState` | React Hooks |
| `XLSX`, `sheet_to_json` | SheetJS Excel 처리 |
| `cursor`, `pagination` | 커서 기반 페이지네이션 |
| `soft delete`, `deleted_at` | Soft Delete 패턴 |
| `await fetch`, `async` | 비동기 처리 |
| `RLS`, `policy` | Row Level Security |

### 6. 문서 생성

```yaml
---
date: {커밋 날짜}
status: 완료
description: {핵심 요약}
category: Frontend|Backend|Infra|DevOps
type: Feature|Bug Fix|Refactor|Documentation|Config
project: {프로젝트명}
tags:
  - {기술스택들}
---
```

본문 구조:
```markdown
# {제목}

> {한 줄 요약}

## 문제 / 목표
{커밋 메시지에서 추출 또는 추론}

## 해결 과정
### 1. {첫 번째 작업}
{커밋 메시지 및 변경 파일 기반}

## 기술 개념 설명
### {감지된 개념}
{2-4문장 설명 + 코드 예시}

## 커밋 내역
| 해시 | 메시지 |
|------|--------|
| abc1234 | feat: ... |

## 변경된 파일
- `path/to/file.ts`

## 결과
- {커밋 수}개 커밋
- +{추가} / -{삭제} lines
```

### 7. Obsidian 저장

Obsidian MCP 도구 사용:
```
create 또는 patch
경로: 개발기록/{YYYY}/{MM}/{제목}.md
```

## 사용 예시

**입력:**
```
오늘 커밋 정리해서 개발 기록 작성해줘
```

**실행:**
1. `git log --since="00:00"` 실행
2. 커밋 그룹핑 및 분석
3. 각 그룹별 마크다운 생성
4. Obsidian MCP로 저장

**입력:**
```
이번 주 meal-acg 프로젝트 커밋만 정리해줘
```

**실행:**
1. `git log --since="1 week ago" -- "apps/admin/*" "apps/user/*"`
2. MealACG 관련 커밋만 필터링
3. 문서 생성 및 저장