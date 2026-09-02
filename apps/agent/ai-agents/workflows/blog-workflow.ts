/**
 * Blog Workflow
 * LangGraph StateGraph로 선언한 블로그 생성 워크플로우
 *
 * START → research → write → review → create → thumbnail → validate → humanReview
 *                      ▲                                                   │
 *                      └──────────── 반려(approved=false) ─────────────────┤
 *                                                                          ▼ 승인
 *                                                                        deploy → END
 *
 * - 검증 실패 여부와 무관하게 humanReview로 넘어간다. 형식 오류는 사람이 보고 판단한다.
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
import { reviewer } from '../agents/reviewer';
import { validator } from '../agents/validator';
import { gitCommitAndPush, PRResult } from '../tools/git-manager';
import { generateThumbnail } from '../tools/thumbnail-generator';

type ReviewResult = NonNullable<Awaited<ReturnType<typeof reviewer>>['reviewResult']>;

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
  images: Annotation<string[] | undefined>,
  humanApproval: Annotation<boolean | undefined>,
  humanFeedback: Annotation<string | undefined>,
  metadata: Annotation<PostMetadata | undefined>,
  filepath: Annotation<string | undefined>,
  validationResult: Annotation<ValidationResult | undefined>,
  reviewResult: Annotation<ReviewResult | undefined>,
  thumbnailImage: Annotation<BlogPostState['thumbnailImage']>,
  commitHash: Annotation<string | undefined>,
  prResult: Annotation<PRResult | undefined>,
});

type State = typeof StateAnnotation.State;

export type HumanReviewCallback = (
  state: BlogPostState
) => Promise<{ approved: boolean; feedback?: string }>;

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
  await announce(config, 'thumbnail', '🖼️ 5단계: 썸네일 이미지 생성', 65);
  const result = await generateThumbnail(state.metadata, state.category || 'tech', cfg(config).onProgress);
  if (!result) return {};
  return {
    thumbnailImage: result,
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
  const { approved, feedback } = await onHumanReview(state);
  if (!approved) {
    await announce(config, 'write', '📝 피드백 반영하여 2단계(Write)부터 재실행...', 30);
  }
  return { humanApproval: approved, humanFeedback: feedback };
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
  // 반려 → write부터 재실행 (리서치는 재사용), 승인 → deploy
  .addConditionalEdges('humanReview', (s) => (s.humanApproval ? 'deploy' : 'write'), ['deploy', 'write'])
  .addEdge('deploy', END);

export const blogWorkflowGraph = graph.compile();

// 반려 1회당 super-step 6개(write~humanReview). 100이면 약 15회 반려까지 허용.
// ponytail: 단순 상한. 피드백 유형별 진입점 분기와 명시적 횟수 제한은 Phase 1-3에서.
const RECURSION_LIMIT = 100;

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
    data: { filepath: state.filepath, prResult: state.prResult },
  });

  return state;
}
