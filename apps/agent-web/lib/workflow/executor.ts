/**
 * Workflow Executor
 * Agent 앱의 워크플로우를 실행하고 Supabase에 진행상황을 기록
 *
 * 워크플로우 순서:
 * 1. Research (15%)
 * 2. Write (30%)
 * 3. Review (45%)
 * 4. Create (60%)
 * 5. Validate (75%)
 * 6. Human Review (85%)
 * 7. Deploy (95%)
 */

import { runBlogWorkflow } from "@agent/ai-agents/workflows/blog-workflow";
import { gitCommitAndPush } from "@agent/ai-agents/tools/git-manager";
import type { StreamEvent, BlogPostState } from "@agent/ai-agents/types/workflow";
import { jobManager } from "@/lib/queue/job-manager";
import type { JobStatus } from "@/lib/types";

/**
 * 워크플로우 실행 (Deploy 전까지)
 */
export async function executeWorkflow(
  jobId: string,
  topic: string,
  category: string = "tech"
): Promise<void> {
  console.log(`[Workflow] Starting workflow for job ${jobId}, topic: ${topic}`);

  try {
    // 상태 업데이트: 실행 중
    await jobManager.updateStatus(jobId, "running", "init", 5);

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

      // 단계별 진행률 매핑
      const stepProgress: Record<string, number> = {
        research: 15,
        write: 30,
        review: 45,
        create: 60,
        validate: 75,
        human_review: 85,
        pending_deploy: 90,
        deploy: 95,
        completed: 100,
        workflow: 90,
      };

      // step을 JobStatus로 매핑
      const stepToStatus: Record<string, JobStatus> = {
        research: "research",
        write: "writing",
        review: "review",
        create: "creating",
        validate: "validating",
        human_review: "human_review",
        pending_deploy: "pending_deploy",
        deploy: "deploying",
        completed: "completed",
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
    const onHumanReview = async (state: BlogPostState & { reviewResult?: unknown }) => {
      console.log(`[Workflow] Human review requested for job ${jobId}`);

      // 상태를 human_review로 변경
      // 검증된 콘텐츠와 메타데이터 저장
      await jobManager.updateJob(jobId, {
        status: "human_review",
        human_approval: null,
        human_feedback: null,
        draft_content: state.draftContent,
        final_content: state.finalContent,
        metadata: state.metadata as unknown,
        review_result: state.reviewResult ?? null,
        validation_result: state.validationResult as unknown,
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
        },
      });

      // Human review 결과를 polling으로 대기
      const maxWaitTime = 30 * 60 * 1000; // 30분
      const pollInterval = 2000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const job = await jobManager.getJob(jobId);

        if (!job) {
          throw new Error("Job not found during human review");
        }

        // human_approval이 설정되었으면 결과 반환
        if (job.human_approval !== null) {
          console.log(
            `[Workflow] Human review completed: approved=${job.human_approval}`
          );
          return {
            approved: job.human_approval,
            feedback: job.human_feedback || undefined,
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
      category
    );

    // 검증 결과 확인
    if (result.validationResult?.passed) {
      // 검증 통과 - pending_deploy 상태로 변경하고 사용자 승인 대기
      await jobManager.updateJob(jobId, {
        status: "pending_deploy",
        progress: 90,
        current_step: "pending_deploy",
        final_content: result.finalContent,
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
        message: "워크플로우 완료 (검증 실패)",
        data: { validationResult: result.validationResult },
      });

      console.log(`[Workflow] Validation failed, workflow completed for job ${jobId}`);
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
  }
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

    // 상태 업데이트: deploying
    await jobManager.updateStatus(jobId, "deploying", "deploy", 95);

    await jobManager.logProgress(jobId, {
      step: "deploy",
      status: "started",
      message: "배포를 시작합니다...",
    });

    // Deploy 실행을 위한 상태 구성
    const state: BlogPostState = {
      topic: job.topic,
      currentStep: "deploy",
      progress: 95,
      finalContent: job.final_content || undefined,
      metadata: job.metadata as BlogPostState["metadata"],
      validationResult: job.validation_result as BlogPostState["validationResult"],
      category: job.category as "tech" | "life",
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
  onHumanReview: (state: BlogPostState) => Promise<{ approved: boolean; feedback?: string }>,
  category: string = "tech"
): Promise<BlogPostState> {
  // skipDeploy: true를 전달하여 deploy 단계를 건너뜀
  // 사용자가 배포를 승인하면 executeDeploy에서 별도로 처리
  const result = await runBlogWorkflow(
    topic,
    onProgress,
    onHumanReview,
    category as "tech" | "life",
    true // skipDeploy
  );
  return result;
}
