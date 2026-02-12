/**
 * Blog Workflow
 * LangGraph를 사용한 블로그 생성 워크플로우
 *
 * 워크플로우 순서:
 * 1. Research (15%) - 주제 리서치
 * 2. Write (30%) - 초안 작성
 * 3. Review (45%) - AI SEO & 기술 검토
 * 4. Create (60%) - 콘텐츠 개선 및 메타데이터 생성
 * 5. Thumbnail (65%) - 썸네일 이미지 생성
 * 6. Validate (75%) - 콘텐츠 검증
 * 7. Human Review (85%) - 사용자 검토 (승인/수정 요청)
 *    - 승인 → Deploy로 진행
 *    - 수정 요청 → Write(2단계)부터 재실행
 * 8. Deploy (95%) - Git 브랜치 생성 + PR 생성
 */

import { Annotation } from '@langchain/langgraph';
import { BlogPostState, OnProgressCallback, Category } from '../types/workflow';
import { geminiResearcher } from '../agents/gemini-researcher';
import { geminiWriter } from '../agents/gemini-writer';
import { geminiCreator } from '../agents/gemini-creator';
import { reviewer } from '../agents/reviewer';
import { validator } from '../agents/validator';
import { gitCommitAndPush, PRResult } from '../tools/git-manager';
import { generateThumbnail } from '../tools/thumbnail-generator';

/**
 * State Annotation 정의
 */
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  tone: Annotation<string>,
  targetReader: Annotation<string>,
  template: Annotation<string>,
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
  thumbnailImage: Annotation<any>,
});

/**
 * 워크플로우 실행
 */
export async function runBlogWorkflow(
  topic: string,
  onProgress?: OnProgressCallback,
  onHumanReview?: (state: BlogPostState) => Promise<{ approved: boolean; feedback?: string }>,
  category: Category = 'tech',
  skipDeploy: boolean = false,
  options?: { tone?: string; targetReader?: string; template?: string }
): Promise<BlogPostState & { prResult?: PRResult }> {
  // 초기 상태
  let state: BlogPostState & { prResult?: PRResult; reviewResult?: any } = {
    topic,
    category,
    tone: options?.tone,
    targetReader: options?.targetReader,
    template: options?.template,
    currentStep: 'init',
    progress: 0,
  };

  // 1. Research (15%)
  await onProgress?.({
    step: 'research',
    status: 'progress',
    message: '📚 1단계: 리서치 시작',
    progress: 15,
  });
  const researchResult = await geminiResearcher(state, onProgress);
  state = { ...state, ...researchResult };

  // Write → Review → Create → Validate → Human Review 루프
  let approved = false;

  while (!approved) {
    // 2. Write (30%)
    await onProgress?.({
      step: 'write',
      status: 'progress',
      message: '✍️ 2단계: 초안 작성 시작',
      progress: 30,
    });
    const writeResult = await geminiWriter(state, onProgress);
    state = { ...state, ...writeResult };

    // 3. Review (45%)
    await onProgress?.({
      step: 'review',
      status: 'progress',
      message: '🔍 3단계: AI SEO & 기술 검토',
      progress: 45,
    });
    const reviewResult = await reviewer(state, onProgress);
    state = { ...state, ...reviewResult };

    // 4. Create (60%)
    await onProgress?.({
      step: 'create',
      status: 'progress',
      message: '🎨 4단계: 콘텐츠 개선 및 메타데이터 생성',
      progress: 60,
    });
    const createResult = await geminiCreator(state, onProgress);
    state = { ...state, ...createResult };

    // 5. Thumbnail (65%) - 썸네일 생성 (실패 시 계속 진행)
    if (state.metadata) {
      await onProgress?.({
        step: 'thumbnail',
        status: 'progress',
        message: '🖼️ 5단계: 썸네일 이미지 생성',
        progress: 65,
      });
      const thumbnailResult = await generateThumbnail(
        state.metadata,
        state.category || 'tech',
        onProgress,
      );
      if (thumbnailResult) {
        state.thumbnailImage = thumbnailResult;
        state.metadata = {
          ...state.metadata,
          thumbnailImage: thumbnailResult.path,
        };
      }
    }

    // 6. Validate (75%)
    await onProgress?.({
      step: 'validate',
      status: 'progress',
      message: '✅ 6단계: 콘텐츠 검증',
      progress: 75,
    });
    const validateResult = await validator(state, onProgress);
    state = { ...state, ...validateResult };

    // 7. Human Review (85%)
    if (onHumanReview) {
      await onProgress?.({
        step: 'human_review',
        status: 'progress',
        message: '👤 7단계: 사용자 검토 대기 중...',
        progress: 85,
      });

      const humanReviewResult = await onHumanReview(state);
      state.humanApproval = humanReviewResult.approved;
      state.humanFeedback = humanReviewResult.feedback;
      approved = humanReviewResult.approved;

      if (!approved) {
        // 수정 요청 시 Write(2단계)부터 재실행
        await onProgress?.({
          step: 'write',
          status: 'progress',
          message: '📝 피드백 반영하여 2단계(Write)부터 재실행...',
          progress: 30,
        });
      }
    } else {
      // onHumanReview가 없으면 자동 승인
      state.humanApproval = true;
      approved = true;
    }
  }

  // 8. Deploy (95%) - 검증 통과하고 skipDeploy가 false인 경우만
  if (state.validationResult?.passed && !skipDeploy) {
    await onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: '🚀 8단계: Git 브랜치 생성 및 PR 생성',
      progress: 95,
    });
    const deployResult = await gitCommitAndPush(state, onProgress);
    state = { ...state, ...deployResult };
  } else if (!state.validationResult?.passed) {
    await onProgress?.({
      step: 'deploy',
      status: 'error',
      message: '❌ 검증 실패로 배포가 건너뛰어졌습니다.',
      progress: 90,
      data: { validationResult: state.validationResult },
    });
  }
  // skipDeploy가 true면 deploy 단계를 건너뜀 (사용자 승인 대기)

  await onProgress?.({
    step: 'completed',
    status: 'completed',
    message: '🎉 워크플로우 완료!',
    progress: 100,
    data: {
      filepath: state.filepath,
      prResult: state.prResult,
    },
  });

  return state;
}
