/**
 * Blog Workflow
 * LangGraph를 사용한 블로그 생성 워크플로우
 */

import { Annotation } from '@langchain/langgraph';
import { BlogPostState, OnProgressCallback } from '../types/workflow';
import { geminiResearcher } from '../agents/gemini-researcher';
import { geminiWriter } from '../agents/gemini-writer';
import { geminiCreator } from '../agents/gemini-creator';
import { reviewer } from '../agents/reviewer';
import { validator } from '../agents/validator';
import { createMdxFile } from '../tools/file-manager';
import { gitCommitAndPush, PRResult } from '../tools/git-manager';

/**
 * State Annotation 정의
 */
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  currentStep: Annotation<string>,
  progress: Annotation<number>,
  researchData: Annotation<any>,
  draftContent: Annotation<string>,
  finalContent: Annotation<string>,
  images: Annotation<string[]>,
  humanApproval: Annotation<boolean>,
  humanFeedback: Annotation<string>,
  metadata: Annotation<any>,
  filepath: Annotation<string>,
  validationResult: Annotation<any>,
  reviewResult: Annotation<any>,
  commitHash: Annotation<string>,
  prResult: Annotation<PRResult>,
});

/**
 * 조건부 엣지: humanApproval 체크
 */
function shouldContinue(state: typeof StateAnnotation.State): string {
  if (state.humanApproval === true) {
    return 'create';
  } else if (state.humanApproval === false) {
    return 'write';
  }
  // humanApproval이 undefined면 humanReview로 유지
  return 'humanReview';
}

/**
 * 워크플로우 실행 (새 에이전트 통합)
 *
 * 흐름:
 * 1. Research (geminiResearcher) - 주제 리서치
 * 2. Write (geminiWriter) - 초안 작성
 * 3. Review (reviewer) - SEO & Tech 검토
 * 4. Human Review - 사용자 검토
 * 5. Create (geminiCreator) - 콘텐츠 개선 및 메타데이터 생성
 * 6. Create File - MDX 파일 생성
 * 7. Validate - 파일 검증
 * 8. Deploy - Git 브랜치 생성 + PR 생성
 */
export async function runBlogWorkflow(
  topic: string,
  onProgress?: OnProgressCallback,
  onHumanReview?: (state: BlogPostState) => Promise<{ approved: boolean; feedback?: string }>
): Promise<BlogPostState & { prResult?: PRResult }> {
  // 초기 상태
  let state: BlogPostState & { prResult?: PRResult; reviewResult?: any } = {
    topic,
    currentStep: 'init',
    progress: 0,
  };

  // 1. Research
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '📚 1단계: 리서치 시작',
  });
  const researchResult = await geminiResearcher(state, onProgress);
  state = { ...state, ...researchResult };

  // 2. Write
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '✍️ 2단계: 초안 작성 시작',
  });
  const writeResult = await geminiWriter(state, onProgress);
  state = { ...state, ...writeResult };

  // 3. Review (SEO & Tech)
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '🔍 3단계: SEO & 기술 검토 시작',
  });
  const reviewResult = await reviewer(state, onProgress);
  state = { ...state, ...reviewResult };

  // 4. Human Review
  if (onHumanReview) {
    onProgress?.({
      step: 'workflow',
      status: 'progress',
      message: '👤 4단계: 사용자 검토 대기',
    });
    const humanReviewResult = await onHumanReview(state);
    state.humanApproval = humanReviewResult.approved;
    state.humanFeedback = humanReviewResult.feedback;

    // 승인되지 않으면 다시 작성
    if (!humanReviewResult.approved) {
      onProgress?.({
        step: 'workflow',
        status: 'progress',
        message: '📝 피드백 반영하여 재작성 중...',
      });
      const rewriteResult = await geminiWriter(state, onProgress);
      state = { ...state, ...rewriteResult };

      // 다시 리뷰
      const reReviewResult = await reviewer(state, onProgress);
      state = { ...state, ...reReviewResult };

      // 다시 사용자 검토
      const retryReviewResult = await onHumanReview(state);
      state.humanApproval = retryReviewResult.approved;
      state.humanFeedback = retryReviewResult.feedback;
    }
  } else {
    // onHumanReview가 없으면 자동 승인
    state.humanApproval = true;
  }

  // 5. Create (Gemini로 콘텐츠 개선 및 메타데이터 생성)
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '🎨 5단계: 콘텐츠 개선 및 메타데이터 생성',
  });
  const createResult = await geminiCreator(state, onProgress);
  state = { ...state, ...createResult };

  // 6. Create File
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '📄 6단계: MDX 파일 생성',
  });
  const fileResult = await createMdxFile(state, onProgress);
  state = { ...state, ...fileResult };

  // 7. Validate
  onProgress?.({
    step: 'workflow',
    status: 'progress',
    message: '✅ 7단계: 파일 검증',
  });
  const validateResult = await validator(state, onProgress);
  state = { ...state, ...validateResult };

  // 8. Deploy (검증 통과한 경우만)
  if (state.validationResult?.passed) {
    onProgress?.({
      step: 'workflow',
      status: 'progress',
      message: '🚀 8단계: Git 브랜치 생성 및 PR 생성',
    });
    const deployResult = await gitCommitAndPush(state, onProgress);
    state = { ...state, ...deployResult };
  } else {
    onProgress?.({
      step: 'workflow',
      status: 'error',
      message: '❌ 검증 실패로 배포가 건너뛰어졌습니다.',
      data: { validationResult: state.validationResult },
    });
  }

  onProgress?.({
    step: 'workflow',
    status: 'completed',
    message: '🎉 워크플로우 완료!',
    data: {
      filepath: state.filepath,
      prResult: state.prResult,
    },
  });

  return state;
}
