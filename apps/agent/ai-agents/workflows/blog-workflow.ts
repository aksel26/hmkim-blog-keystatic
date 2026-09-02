/**
 * Blog Workflow
 * LangGraph StateGraph로 선언한 블로그 생성 워크플로우
 *
 * START → research → write → review → create → thumbnail → validate → humanReview
 *                      ▲                        ▲                             │
 *                      │ rerunFrom='write'      │ rerunFrom='create' (기본)   │ 반려
 *                      └────────────────────────┴─────────────────────────────┤
 *                                                     반려 MAX_REJECTIONS 초과 → END
 *                                                                          ▼ 승인
 *                                                                        deploy → END
 *
 * - 검증 실패 여부와 무관하게 humanReview로 넘어간다. 형식 오류는 사람이 보고 판단한다.
 * - 반려 시 리서치는 항상 재사용한다. 피드백은 create(와 write)가 프롬프트에 반영한다.
 *   기본 재진입점은 create: 사람이 검토한 finalContent를 초안 자리에 놓고 피드백만 반영한다.
 *   초안·리뷰를 다시 만들지 않아 LLM 호출 2회를 아낀다.
 * - 썸네일은 제목이 바뀌지 않았으면 재생성하지 않는다 (이미지 생성이 가장 비싼 호출).
 * - 검증 실패 상태에서는 승인해도 PR을 만들지 않는다. 형식이 깨진 파일로 블로그 빌드를 깨지 않기 위한 하한선이다.
 * - deploy는 검증 통과 + skipDeploy=false 일 때만 PR을 만든다. 자동 게시는 하지 않는다.
 * - 콜백(onProgress/onHumanReview)과 skipDeploy는 config.configurable로 노드에 전달한다.
 */

import {
  Annotation,
  END,
  START,
  StateGraph,
  type LangGraphRunnableConfig,
} from '@langchain/langgraph';
import {
  BlogPostState,
  Category,
  OnProgressCallback,
  PostMetadata,
  ResearchData,
  ValidationResult,
} from '../types/workflow';
import { geminiResearcher } from '../agents/gemini-researcher';
import { geminiWriter } from '../agents/gemini-writer';
import { geminiCreator } from '../agents/gemini-creator';
import { reviewer, ReviewResult } from '../agents/reviewer';
import { validator } from '../agents/validator';
import { gitCommitAndPush, PRResult } from '../tools/git-manager';
import { generateThumbnail } from '../tools/thumbnail-generator';

const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  category: Annotation<Category>,
  tone: Annotation<string | undefined>,
  targetReader: Annotation<string | undefined>,
  template: Annotation<string | undefined>,
  currentStep: Annotation<string>,
  progress: Annotation<number>,
  researchData: Annotation<ResearchData | undefined>,
  draftContent: Annotation<string | undefined>,
  finalContent: Annotation<string | undefined>,
  humanApproval: Annotation<boolean | undefined>,
  humanFeedback: Annotation<string | undefined>,
  metadata: Annotation<PostMetadata | undefined>,
  validationResult: Annotation<ValidationResult | undefined>,
  reviewResult: Annotation<ReviewResult | undefined>,
  thumbnailImage: Annotation<BlogPostState['thumbnailImage']>,
  thumbnailFor: Annotation<string | undefined>, // 썸네일을 만들 때의 제목
  prResult: Annotation<PRResult | undefined>,
  rejections: Annotation<number | undefined>,
  rerunFrom: Annotation<RerunFrom | undefined>,
});

type State = typeof StateAnnotation.State;

/** 반려 후 어디부터 다시 돌릴지. create = 피드백만 반영, write = 초안부터 새로 */
export type RerunFrom = 'write' | 'create';

export type HumanReviewCallback = (
  state: BlogPostState
) => Promise<{ approved: boolean; feedback?: string; rerunFrom?: RerunFrom }>;

/** 이 횟수를 넘겨 반려되면 배포 없이 종료한다 */
export const MAX_REJECTIONS = 3;

interface WorkflowConfig {
  onProgress?: OnProgressCallback;
  onHumanReview?: HumanReviewCallback;
  skipDeploy: boolean;
}

const cfg = (config: LangGraphRunnableConfig) => config.configurable as WorkflowConfig;

const announce = (config: LangGraphRunnableConfig, step: string, message: string, progress: number) =>
  cfg(config).onProgress?.({ step, status: 'progress', message, progress });

// ---- nodes ----

async function research(state: State, config: LangGraphRunnableConfig) {
  await announce(config, 'research', '📚 1단계: 리서치 시작', 15);
  return geminiResearcher(state, cfg(config).onProgress);
}

async function write(state: State, config: LangGraphRunnableConfig) {
  await announce(config, 'write', '✍️ 2단계: 초안 작성 시작', 30);
  return geminiWriter(state, cfg(config).onProgress);
}

async function review(state: State, config: LangGraphRunnableConfig) {
  await announce(config, 'review', '🔍 3단계: AI SEO & 기술 검토', 45);
  return reviewer(state, cfg(config).onProgress);
}

async function create(state: State, config: LangGraphRunnableConfig) {
  await announce(config, 'create', '🎨 4단계: 콘텐츠 개선 및 메타데이터 생성', 60);
  return geminiCreator(state, cfg(config).onProgress);
}

// 썸네일은 실패해도 워크플로우를 멈추지 않는다 (generateThumbnail이 null 반환)
async function thumbnail(state: State, config: LangGraphRunnableConfig) {
  if (!state.metadata) return {};
  const { title } = state.metadata;
  // 재실행 시 제목이 그대로면 기존 이미지를 재사용하고 경로만 다시 붙인다
  const prev = state.thumbnailImage;
  if (prev && state.thumbnailFor === title) {
    return { metadata: { ...state.metadata, thumbnailImage: prev.path } };
  }
  await announce(config, 'thumbnail', '🖼️ 5단계: 썸네일 이미지 생성', 65);
  const result = await generateThumbnail(state.metadata, state.category || 'tech', cfg(config).onProgress);
  // 실패하면 이전 제목의 이미지가 남지 않도록 비운다 (metadata에 경로가 없는데 파일만 커밋되는 것 방지)
  if (!result) return { thumbnailImage: undefined, thumbnailFor: undefined };
  return {
    thumbnailImage: result,
    thumbnailFor: title,
    metadata: { ...state.metadata, thumbnailImage: result.path },
  };
}

async function validate(state: State, config: LangGraphRunnableConfig) {
  await announce(config, 'validate', '✅ 6단계: 콘텐츠 검증', 75);
  return validator(state, cfg(config).onProgress);
}

async function humanReview(state: State, config: LangGraphRunnableConfig) {
  const { onHumanReview } = cfg(config);
  // 콜백이 없으면 자동 승인 (CLI 비대화형 실행용)
  if (!onHumanReview) return { humanApproval: true };

  await announce(config, 'human_review', '👤 7단계: 사용자 검토 대기 중...', 85);
  const { approved, feedback, rerunFrom = 'create' } = await onHumanReview(state);
  if (approved) return { humanApproval: true };

  const rejections = (state.rejections ?? 0) + 1;
  if (rejections > MAX_REJECTIONS) {
    await cfg(config).onProgress?.({
      step: 'human_review',
      status: 'error',
      message: `❌ 반려 ${MAX_REJECTIONS}회를 넘겨 배포 없이 종료합니다.`,
      progress: 85,
    });
    return { humanApproval: false, humanFeedback: feedback, rejections };
  }

  await announce(config, 'human_review', `📝 피드백 반영하여 재실행 (${rejections}/${MAX_REJECTIONS})`, 85);
  return {
    humanApproval: false,
    humanFeedback: feedback,
    rerunFrom,
    rejections,
    // create부터 다시 돌 때는 사람이 검토한 최종본을 초안 자리에 놓는다.
    // 그래야 피드백이 원본 초안이 아니라 검토본에 적용되고 이전 라운드 결과가 유지된다.
    ...(rerunFrom === 'create' && state.finalContent ? { draftContent: state.finalContent } : {}),
  };
}

async function deploy(state: State, config: LangGraphRunnableConfig) {
  const { onProgress, skipDeploy } = cfg(config);
  if (!state.validationResult?.passed) {
    await onProgress?.({
      step: 'deploy',
      status: 'error',
      message: '❌ 검증 실패로 배포가 건너뛰어졌습니다.',
      progress: 90,
      data: { validationResult: state.validationResult },
    });
    return {};
  }
  // skipDeploy: agent-web은 여기서 멈추고 별도 승인 후 executeDeploy로 PR을 만든다
  if (skipDeploy) return {};

  await announce(config, 'deploy', '🚀 8단계: Git 브랜치 생성 및 PR 생성', 95);
  return gitCommitAndPush(state, onProgress);
}

// ---- graph ----

const graph = new StateGraph(StateAnnotation)
  .addNode('research', research)
  .addNode('write', write)
  .addNode('review', review)
  .addNode('create', create)
  .addNode('thumbnail', thumbnail)
  .addNode('validate', validate)
  .addNode('humanReview', humanReview)
  .addNode('deploy', deploy)
  .addEdge(START, 'research')
  .addEdge('research', 'write')
  .addEdge('write', 'review')
  .addEdge('review', 'create')
  .addEdge('create', 'thumbnail')
  .addEdge('thumbnail', 'validate')
  .addEdge('validate', 'humanReview')
  // 승인 → deploy, 반려 → rerunFrom 노드로 (리서치는 재사용), 상한 초과 → 종료
  .addConditionalEdges(
    'humanReview',
    (s) => {
      if (s.humanApproval) return 'deploy';
      if ((s.rejections ?? 0) > MAX_REJECTIONS) return END;
      return s.rerunFrom ?? 'create';
    },
    ['deploy', 'write', 'create', END]
  )
  .addEdge('deploy', END);

export const blogWorkflowGraph = graph.compile();

// 최악 경로: 첫 패스 7 step + (MAX_REJECTIONS + 1)번째 반려까지 각 6 step(write~humanReview). 넉넉히 2배.
const RECURSION_LIMIT = (7 + 6 * (MAX_REJECTIONS + 1)) * 2;

/**
 * 워크플로우 실행
 */
export async function runBlogWorkflow(
  topic: string,
  onProgress?: OnProgressCallback,
  onHumanReview?: HumanReviewCallback,
  category: Category = 'tech',
  skipDeploy: boolean = false,
  options?: { tone?: string; targetReader?: string; template?: string }
): Promise<BlogPostState & { prResult?: PRResult }> {
  const state = await blogWorkflowGraph.invoke(
    {
      topic,
      category,
      tone: options?.tone,
      targetReader: options?.targetReader,
      template: options?.template,
      currentStep: 'init',
      progress: 0,
    },
    {
      configurable: { onProgress, onHumanReview, skipDeploy } satisfies WorkflowConfig,
      recursionLimit: RECURSION_LIMIT,
    }
  );

  await onProgress?.({
    step: 'completed',
    status: 'completed',
    message: '🎉 워크플로우 완료!',
    progress: 100,
    data: { prResult: state.prResult },
  });

  return state;
}
