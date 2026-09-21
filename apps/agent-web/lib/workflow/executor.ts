/**
 * Workflow Executor
 * Agent 앱의 워크플로우를 실행하고 Supabase에 진행상황을 기록
 *
 * 워크플로우 순서:
 * 1. Research (15%)
 * 2. Write (30%)
 * 3. Review (45%)
 * 4. Create (60%)
 * 5. Fact Check (62%) - 참고용, 배포를 막지 않음
 * 6. Thumbnail (68%)
 * 7. Validate (75%)
 * 8. Human Review (85%)
 * 9. Deploy (95%)
 */

import { runBlogWorkflow, MAX_REJECTIONS, type HumanReviewCallback, type ResumeState } from "@agent/ai-agents/workflows/blog-workflow";
import { gitCommitAndPush } from "@agent/ai-agents/tools/git-manager";
import type { StreamEvent, BlogPostState } from "@agent/ai-agents/types/workflow";
import { jobManager } from "@/lib/queue/job-manager";
import type { JobStatus } from "@/lib/types";

// 이 프로세스에서 워크플로우가 돌고 있는 job. 서버가 재시작되면 비므로, human-review route가
// "결정을 읽어 갈 폴링 루프가 살아 있는지" 판단하는 데 쓴다. dev HMR에도 유지되도록 globalThis에 둔다.
// ponytail: 단일 프로세스 전제. 인스턴스가 여럿이면 DB heartbeat/lease로 바꿔야 한다
const activeJobs: Set<string> = ((globalThis as { __activeWorkflowJobs?: Set<string> }).__activeWorkflowJobs ??= new Set());

/** 돌고 있는 워크플로우가 없을 때만 선점한다. 연속 클릭으로 재개가 두 번 시작되지 않게 route에서 동기로 호출 */
export function tryClaimWorkflow(jobId: string): boolean {
  if (activeJobs.has(jobId)) return false;
  activeJobs.add(jobId);
  return true;
}

/** DB에 저장된 썸네일(base64)을 워크플로우 상태 형태로 되돌린다 */
function thumbnailFromJob(
  job: { thumbnail_data: string | null },
  metadata: BlogPostState["metadata"]
): BlogPostState["thumbnailImage"] {
  if (!job.thumbnail_data || !metadata?.thumbnailImage) return undefined;
  return {
    buffer: job.thumbnail_data,
    mimeType: metadata.thumbnailImage.endsWith('.jpg')
      ? 'image/jpeg'
      : metadata.thumbnailImage.endsWith('.webp')
        ? 'image/webp'
        : 'image/png',
    path: metadata.thumbnailImage,
  };
}

/**
 * 워크플로우 실행 (Deploy 전까지)
 */
export async function executeWorkflow(
  jobId: string,
  topic: string,
  category: string = "tech",
  options?: { tone?: string; targetReader?: string; template?: string },
  resume?: ResumeState
): Promise<void> {
  console.log(
    `[Workflow] ${resume ? "Resuming" : "Starting"} workflow for job ${jobId}, topic: ${topic}, options: ${JSON.stringify(options ?? {})}` +
      (resume ? `, rerunFrom: ${resume.rerunFrom ?? "research"}, rejections: ${resume.rejections ?? 0}` : "")
  );

  activeJobs.add(jobId);
  try {
    // 상태 업데이트: 실행 중 (재개할 때는 진행률을 되돌리지 않는다)
    if (!resume) await jobManager.updateStatus(jobId, "running", "init", 5);

    // 진행 상황 콜백
    const onProgress = async (event: StreamEvent) => {
      console.log(`[Workflow] Progress event:`, event);

      // 진행 상황을 Supabase에 기록
      await jobManager.logProgress(jobId, {
        step: event.step,
        status: event.status,
        message: event.message,
        data: event.data as Record<string, unknown>,
      });

      // 그래프 종료 이벤트로는 job 상태를 바꾸지 않는다. 최종 상태(pending_deploy/completed)는 실행이 끝난 뒤 아래에서 정한다.
      // 여기서 completed를 쓰면 pending_deploy로 고쳐지기 전 잠깐 동안 클라이언트가 끝난 작업으로 보고 SSE와 폴링을 끊어,
      // 승인 후에도 화면이 검토 패널에 굳는다
      if (event.step === "completed") return;

      // 단계별 진행률 매핑
      const stepProgress: Record<string, number> = {
        research: 15,
        write: 30,
        review: 45,
        create: 60,
        fact_check: 62,
        thumbnail: 68,
        validate: 75,
        human_review: 85,
        pending_deploy: 90,
        deploy: 95,
        workflow: 90,
      };

      // step을 JobStatus로 매핑
      const stepToStatus: Record<string, JobStatus> = {
        research: "research",
        write: "writing",
        review: "review",
        create: "creating",
        fact_check: "review", // 전용 JobStatus를 두지 않고 'AI 검토'로 표시한다
        thumbnail: "thumbnail",
        validate: "validating",
        human_review: "human_review",
        pending_deploy: "pending_deploy",
        deploy: "deploying",
        workflow: "running",
      };

      // event.progress가 있으면 우선 사용, 없으면 stepProgress 매핑 사용
      const progress = event.progress ?? stepProgress[event.step] ?? 0;
      const currentStep = event.step;
      const stepStatus: JobStatus = stepToStatus[event.step] || "running";

      // review step 완료 시 reviewResult 저장
      if (event.step === "review" && event.status === "completed" && event.data) {
        const reviewData = event.data as Record<string, unknown>;
        if (reviewData.reviewResult) {
          await jobManager.updateJob(jobId, {
            review_result: reviewData.reviewResult,
          });
        }
      }

      if (event.status === "completed") {
        await jobManager.updateStatus(
          jobId,
          stepStatus,
          currentStep,
          Math.min(progress + 5, 90)
        );
      } else {
        await jobManager.updateStatus(jobId, stepStatus, currentStep, progress);
      }
    };

    // Human Review 콜백 (Validate 후에 호출됨)
    const onHumanReview: HumanReviewCallback = async (state) => {
      console.log(`[Workflow] Human review requested for job ${jobId}`);

      // 상태를 human_review로 변경
      // 검증된 콘텐츠와 메타데이터 저장
      await jobManager.updateJob(jobId, {
        status: "human_review",
        human_approval: null,
        human_feedback: null,
        research_data: state.researchData ?? null,
        draft_content: state.draftContent,
        final_content: state.finalContent,
        metadata: state.metadata as unknown,
        review_result: state.reviewResult ?? null,
        validation_result: state.validationResult as unknown,
        thumbnail_data: state.thumbnailImage?.buffer ?? null,
        current_step: "human_review",
        progress: 85,
      });

      await jobManager.logProgress(jobId, {
        step: "human_review",
        status: "started",
        message: "사용자 검토를 기다리는 중입니다...",
        data: {
          validationPassed: state.validationResult?.passed,
          validationErrors: state.validationResult?.errors,
          rejections: state.rejections ?? 0, // 서버 재시작 후 재개할 때 여기서 이어 센다
        },
      });

      // Human review 결과를 polling으로 대기
      const maxWaitTime = 30 * 60 * 1000; // 30분
      const pollInterval = 2000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const job = await jobManager.getReviewDecision(jobId);

        console.log(`[Workflow] Polling human review for job ${jobId}: human_approval=${job?.human_approval}, status=${job?.status}`);

        if (!job) {
          throw new Error("Job not found during human review");
        }

        // human_approval이 설정되었으면 결과 반환
        if (job.human_approval !== null) {
          console.log(
            `[Workflow] Human review completed: approved=${job.human_approval}`
          );
          if (job.human_approval) return { approved: true };

          // human-review route가 남긴 액션으로 재진입점 결정: rewrite → write, feedback → create
          const logs = await jobManager.getProgressLogs(jobId);
          const action = [...logs].reverse().find((l) => l.step === "human_review" && l.data?.action)?.data?.action;
          return {
            approved: false,
            feedback: job.human_feedback || undefined,
            rerunFrom: action === "rewrite" ? "write" : "create",
          };
        }

        // 대기
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // 타임아웃 - 자동 승인
      console.log(`[Workflow] Human review timeout, auto-approving`);
      return { approved: true };
    };

    // 워크플로우 실행 (Deploy 제외)
    const result = await runBlogWorkflowWithoutDeploy(
      topic,
      onProgress,
      onHumanReview,
      category,
      options,
      resume
    );

    // 검증 통과 + 사람 승인(반려 상한 초과 시 humanApproval=false)일 때만 배포 대기로
    if (result.validationResult?.passed && result.humanApproval !== false) {
      // DB에서 현재 값을 읽어 사용자가 human_review 중 직접 편집한 콘텐츠를 보존
      const currentJob = await jobManager.getJob(jobId);

      // 검증 통과 - pending_deploy 상태로 변경하고 사용자 승인 대기
      await jobManager.updateJob(jobId, {
        status: "pending_deploy",
        progress: 90,
        current_step: "pending_deploy",
        final_content: currentJob?.final_content || result.finalContent,
        metadata: result.metadata as unknown,
        validation_result: result.validationResult as unknown,
      });

      await jobManager.logProgress(jobId, {
        step: "pending_deploy",
        status: "started",
        message: "검증 완료! 배포를 승인해주세요.",
      });

      console.log(`[Workflow] Validation passed, waiting for deploy approval for job ${jobId}`);
    } else {
      // 검증 실패 - 완료 처리
      await jobManager.updateJob(jobId, {
        status: "completed",
        progress: 100,
        current_step: "completed",
        final_content: result.finalContent,
        metadata: result.metadata as unknown,
        validation_result: result.validationResult as unknown,
      });

      await jobManager.logProgress(jobId, {
        step: "complete",
        status: "completed",
        message: result.humanApproval === false ? "워크플로우 완료 (반려 횟수 초과)" : "워크플로우 완료 (검증 실패)",
        data: { validationResult: result.validationResult },
      });

      console.log(`[Workflow] Not deployable (validation or rejection limit), workflow completed for job ${jobId}`);
    }
  } catch (error) {
    console.error(`[Workflow] Error executing workflow for job ${jobId}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await jobManager.setError(jobId, errorMessage);

    await jobManager.logProgress(jobId, {
      step: "error",
      status: "error",
      message: `워크플로우 실행 중 오류 발생: ${errorMessage}`,
      data: { error: errorMessage },
    });
  } finally {
    activeJobs.delete(jobId);
  }
}

/**
 * 서버 재시작으로 폴링 루프가 사라진 작업을, 반려 결정(feedback/rewrite)에 맞춰 DB 상태로 이어 돌린다.
 * 살아 있는 루프가 있으면 그 루프가 결정을 읽어 가므로 호출하지 않는다 (human-review route 참고).
 */
export async function resumeAfterReview(
  jobId: string,
  action: "feedback" | "rewrite",
  feedback: string
): Promise<void> {
  const job = await jobManager.getJob(jobId).catch(() => null);
  if (!job) {
    activeJobs.delete(jobId); // route가 선점한 것을 되돌린다 (이후 경로는 executeWorkflow의 finally가 해제)
    throw new Error("Job not found");
  }

  // 작업 옵션과 반려 횟수는 jobs 컬럼이 아니라 로그에 있다.
  // tone/targetReader: /api/generate의 init 로그, rejections: 마지막 human_review 대기 로그
  const logs = await jobManager.getProgressLogs(jobId);
  const initData = logs.find((l) => l.step === "init")?.data;
  const lastReview = [...logs].reverse().find((l) => l.step === "human_review" && l.status === "started");
  const rejections = (Number(lastReview?.data?.rejections) || 0) + 1; // 지금 처리하는 반려까지
  // 정확도 검증 지적도 로그에 있다. create가 재실행 프롬프트에 반영한다
  const factCheckResult = [...logs].reverse().find((l) => l.step === "fact_check" && l.data?.factCheckResult)
    ?.data?.factCheckResult as BlogPostState["factCheckResult"];

  // humanReview 노드와 같은 상한. 그래프를 거치지 않는 반려이므로 여기서 끊는다
  if (rejections > MAX_REJECTIONS) {
    activeJobs.delete(jobId);
    await jobManager.updateJob(jobId, { status: "completed", progress: 100, current_step: "completed" });
    await jobManager.logProgress(jobId, {
      step: "complete",
      status: "completed",
      message: `워크플로우 완료 (반려 ${MAX_REJECTIONS}회 초과, 배포 없이 종료)`,
    });
    return;
  }

  const metadata = (job.metadata ?? undefined) as BlogPostState["metadata"];
  const researchData = (job.research_data ?? undefined) as BlogPostState["researchData"];
  const resume: ResumeState = {
    humanFeedback: feedback,
    rejections,
    researchData,
    metadata, // slug 유지용
    reviewResult: (job.review_result ?? undefined) as BlogPostState["reviewResult"],
    factCheckResult,
    thumbnailImage: thumbnailFromJob(job, metadata),
    thumbnailFor: metadata?.title,
    // feedback: 사람이 검토(직접 편집 포함)한 최종본을 초안 자리에 놓고 create부터 (humanReview 노드와 같은 규칙)
    // rewrite: write부터. 리서치 결과가 저장되지 않은 예전 작업은 rerunFrom 없이 research부터 다시 돈다
    ...(action === "feedback"
      ? { rerunFrom: "create" as const, draftContent: job.final_content ?? job.draft_content ?? undefined }
      : researchData
        ? { rerunFrom: "write" as const }
        : {}),
  };

  await jobManager.logProgress(jobId, {
    step: "human_review",
    status: "progress",
    message: "서버가 재시작되어 저장된 상태에서 워크플로우를 이어서 실행합니다.",
  });

  await executeWorkflow(
    jobId,
    job.topic,
    job.category,
    {
      tone: (initData?.tone as string | undefined) ?? undefined,
      targetReader: (initData?.targetReader as string | undefined) ?? undefined,
      template: job.template ?? undefined,
    },
    resume
  );
}

/**
 * Deploy 승인 후 실행
 */
export async function executeDeploy(jobId: string): Promise<void> {
  console.log(`[Deploy] Starting deploy for job ${jobId}`);

  try {
    const job = await jobManager.getJob(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status !== "pending_deploy") {
      throw new Error(`Invalid job status for deploy: ${job.status}`);
    }

    // 폴링 프로세스가 죽은 뒤 route가 직접 pending_deploy로 바꾼 경우에도 검증 게이트는 유지
    if (!(job.validation_result as BlogPostState["validationResult"])?.passed) {
      throw new Error("검증 실패 상태에서는 배포할 수 없습니다. 반려 후 다시 생성하세요.");
    }

    // 상태 업데이트: deploying
    await jobManager.updateStatus(jobId, "deploying", "deploy", 95);

    await jobManager.logProgress(jobId, {
      step: "deploy",
      status: "started",
      message: "배포를 시작합니다...",
    });

    // Deploy 실행을 위한 상태 구성
    const metadata = job.metadata as BlogPostState["metadata"];
    const state: BlogPostState = {
      topic: job.topic,
      currentStep: "deploy",
      progress: 95,
      finalContent: job.final_content || undefined,
      metadata,
      validationResult: job.validation_result as BlogPostState["validationResult"],
      category: job.category as "tech" | "life",
      thumbnailImage: thumbnailFromJob(job, metadata),
    };

    // 진행 상황 콜백
    const onProgress = async (event: StreamEvent) => {
      console.log(`[Deploy] Progress event:`, event);

      await jobManager.logProgress(jobId, {
        step: event.step,
        status: event.status,
        message: event.message,
        data: event.data as Record<string, unknown>,
      });
    };

    // Deploy 실행 (콘텐츠 완료 처리)
    const deployResult = await gitCommitAndPush(state, onProgress);

    // 완료 처리
    await jobManager.completeJob(jobId, {
      finalContent: job.final_content || undefined,
      metadata: job.metadata as unknown as Record<string, unknown>,
      prResult: deployResult.prResult as unknown as Record<string, unknown>,
    });

    await jobManager.logProgress(jobId, {
      step: "complete",
      status: "completed",
      message: "콘텐츠 생성이 완료되었습니다!",
      data: {
        branchName: deployResult.prResult?.branchName,
      },
    });

    console.log(`[Deploy] Deploy completed for job ${jobId}`);
  } catch (error) {
    console.error(`[Deploy] Error deploying job ${jobId}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await jobManager.setError(jobId, errorMessage);

    await jobManager.logProgress(jobId, {
      step: "deploy",
      status: "error",
      message: `배포 중 오류 발생: ${errorMessage}`,
      data: { error: errorMessage },
    });
  }
}

/**
 * Deploy 없이 완료 처리 (반려)
 */
export async function skipDeploy(jobId: string): Promise<void> {
  console.log(`[Deploy] Skipping deploy for job ${jobId}`);

  try {
    const job = await jobManager.getJob(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status !== "pending_deploy") {
      throw new Error(`Invalid job status for skip deploy: ${job.status}`);
    }

    // 완료 처리
    await jobManager.updateJob(jobId, {
      status: "completed",
      progress: 100,
      current_step: "completed",
    });

    await jobManager.logProgress(jobId, {
      step: "complete",
      status: "completed",
      message: "배포가 취소되었습니다.",
    });

    console.log(`[Deploy] Deploy skipped for job ${jobId}`);
  } catch (error) {
    console.error(`[Deploy] Error skipping deploy for job ${jobId}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await jobManager.setError(jobId, errorMessage);
  }
}

/**
 * Deploy 없이 워크플로우 실행 (내부 함수)
 */
async function runBlogWorkflowWithoutDeploy(
  topic: string,
  onProgress: (event: StreamEvent) => void | Promise<void>,
  onHumanReview: HumanReviewCallback,
  category: string = "tech",
  options?: { tone?: string; targetReader?: string; template?: string },
  resume?: ResumeState
): Promise<BlogPostState> {
  // skipDeploy: true를 전달하여 deploy 단계를 건너뜀
  // 사용자가 배포를 승인하면 executeDeploy에서 별도로 처리
  const result = await runBlogWorkflow(
    topic,
    onProgress,
    onHumanReview,
    category as "tech" | "life",
    true, // skipDeploy
    options,
    resume
  );
  return result;
}
