# Insight Report: Human Review 및 UI 개선

**날짜**: 2026-01-20
**작업자**: Claude
**프로젝트**: hmkim-blog-keystatic (AI Blog Agent)

---

## 1. 작업 개요

블로그 자동 생성 워크플로우에서 Human Review 기능의 반복 동작 문제를 해결하고, UI를 한글화하며, 전체 워크플로우 진행률 표시를 개선했습니다.

---

## 2. 발견된 문제점

### 2.1 Human Review 1회 제한 문제
- **증상**: "수정 요청"을 한 번 한 뒤, AI 검토 단계에서 "리뷰 완료" 로그가 나왔지만 다음 단계로 진행되지 않음
- **원인**:
  1. 기존 코드가 1회만 재시도 후 무조건 다음 단계로 진행
  2. `onProgress` 콜백이 `await` 되지 않아 비동기 타이밍 문제 발생
  3. SSE hook의 status 보호 로직이 step 변경을 제대로 감지하지 못함

### 2.2 진행률 표시 불일치
- 각 에이전트가 자체 progress를 반환하여 전체 워크플로우 기준 진행률과 맞지 않음

### 2.3 UI 영문 표시
- Human Review 패널이 영문으로 표시되어 사용자 경험 저하

---

## 3. 해결 방안 및 구현

### 3.1 Human Review 무한 반복 로직 (`blog-workflow.ts`)

**Before:**
```typescript
// 1회만 재시도
if (!humanReviewResult.approved) {
  const rewriteResult = await geminiWriter(state, onProgress);
  const reReviewResult = await reviewer(state, onProgress);
  const retryReviewResult = await onHumanReview(state);
}
```

**After:**
```typescript
// 승인될 때까지 반복
while (!approved) {
  await onProgress?.({
    step: 'human_review',
    status: 'progress',
    message: '👤 사용자 검토 대기 중...',
    progress: 50,
  });

  const humanReviewResult = await onHumanReview(state);
  approved = humanReviewResult.approved;

  if (!approved) {
    // 재작성 및 재검토
    const rewriteResult = await geminiWriter(state, onProgress);
    const reReviewResult = await reviewer(state, onProgress);
  }
}
```

### 3.2 onProgress 비동기 처리

**핵심 변경**: 모든 `onProgress?.()` 호출에 `await` 추가

```typescript
// Before
onProgress?.({ step: 'research', ... });

// After
await onProgress?.({ step: 'research', ... });
```

**이유**: DB 업데이트가 완료된 후 다음 단계로 진행해야 SSE 이벤트가 올바른 순서로 전송됨

### 3.3 타입 정의 업데이트 (`workflow.ts`)

```typescript
export interface StreamEvent {
  step: string;
  status: EventStatus;
  message: string;
  progress?: number; // 신규 추가
  data?: any;
}

// async 콜백 지원
export type OnProgressCallback = (event: StreamEvent) => void | Promise<void>;
```

### 3.4 SSE Hook 개선 (`use-job-stream.ts`)

**Before**: status 기반 보호 로직
```typescript
// 이전 상태가 특수 상태이고, 새 상태가 일반 상태면 무시
if (prev && specialStatuses.includes(prev) && !specialStatuses.includes(newStatus)) {
  return prev;
}
```

**After**: step 기반 상태 결정
```typescript
// step이 특수 상태면 해당 상태로 설정
if (currentStep === "human_review") {
  return "human_review";
}
// step이 일반 상태면 status 사용 (workflow 진행 중)
return newStatus;
```

### 3.5 워크플로우 진행률 표준화

| 단계 | Progress |
|------|----------|
| Research | 15% |
| Write | 30% |
| Review | 40% |
| Human Review | 50% |
| Create | 65% |
| Create File | 80% |
| Validate | 90% |
| Deploy | 95% |
| Completed | 100% |

### 3.6 UI 한글화 (`HumanReviewPanel.tsx`)

| 영어 | 한글 |
|------|------|
| Human Review Required | 사용자 검토 필요 |
| AI Review Summary | AI 검토 요약 |
| SEO Score | SEO 점수 |
| Technical Accuracy | 기술 정확도 |
| Suggestions | 제안 사항 |
| Issues | 문제점 |
| Approve | 승인 |
| Request Revision | 수정 요청 |
| Rewrite | 재작성 |

---

## 4. 수정된 파일 목록

1. `apps/agent/ai-agents/workflows/blog-workflow.ts`
   - Human Review while 루프 구현
   - 모든 onProgress에 await 추가
   - 워크플로우 단계별 progress 값 추가

2. `apps/agent/ai-agents/types/workflow.ts`
   - StreamEvent에 progress 필드 추가
   - OnProgressCallback 타입 async 지원

3. `apps/agent-web/lib/workflow/executor.ts`
   - stepProgress/stepToStatus 매핑 업데이트
   - event.progress 우선 사용 로직

4. `apps/agent-web/lib/hooks/use-job-stream.ts`
   - step 기반 status 결정 로직

5. `apps/agent-web/components/job/HumanReviewPanel.tsx`
   - 전체 UI 한글화

---

## 5. 기술적 인사이트

### 5.1 비동기 콜백의 중요성
- `onProgress?.()` 형태로 호출하면 Promise가 무시되어 race condition 발생
- `await onProgress?.()` 형태로 호출해야 순차적 실행 보장

### 5.2 SSE 상태 관리 전략
- status보다 step이 현재 워크플로우 단계를 더 정확히 반영
- 특수 상태(human_review, pending_deploy)는 step 기반으로 감지해야 함

### 5.3 무한 루프 설계 시 고려사항
- 타임아웃 설정 필수 (현재 30분)
- 사용자 피드백 상태 초기화 (`human_approval: null`)
- 최신 상태(reviewResult) 전달 보장

---

## 6. 테스트 체크리스트

- [ ] 새 Job 생성 후 Human Review 단계까지 진행
- [ ] "수정 요청" 클릭 → 재작성 후 다시 Human Review 대기 확인
- [ ] 다시 "수정 요청" 클릭 → 승인 없이 다음 단계로 넘어가지 않는지 확인
- [ ] "승인" 클릭 시 다음 단계(콘텐츠 개선)로 진행 확인
- [ ] 진행률 퍼센트가 전체 워크플로우 기준으로 표시되는지 확인
- [ ] 검토 패널 UI가 모두 한글로 표시되는지 확인

---

## 7. 향후 개선 제안

1. **Human Review 히스토리**: 이전 피드백과 수정 내역을 패널에 표시
2. **자동 저장**: 피드백 입력 중 자동 저장 기능
3. **diff 뷰어**: 원본과 수정본 비교 기능
4. **알림 기능**: Human Review 대기 시 이메일/슬랙 알림

---

*Generated by Claude on 2026-01-20*
