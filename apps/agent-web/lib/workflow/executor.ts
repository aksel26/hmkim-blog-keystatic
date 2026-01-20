/**
 * Workflow Executor
 * Agent 앱의 워크플로우를 실행하고 Supabase에 진행상황을 기록
 */

import { runBlogWorkflow } from "@agent/ai-agents/workflows/blog-workflow";
import { gitCommitAndPush } from "@agent/ai-agents/tools/git-manager";
import type { StreamEvent, BlogPostState } from "@agent/ai-agents/types/workflow";
import { jobManager } from "@/lib/queue/job-manager";
import type { JobStatus } from "@/lib/types";

/**
 * 워크플로우 실행 (PR 생성 전까지)
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

      // 단계별 진행률 계산
      const stepProgress: Record<string, number> = {
        research: 10,
        write: 25,
        review: 40,
        human_review: 50,
        create: 60,
        createFile: 75,
        validate: 85,
        workflow: 90,
      };

      // step을 JobStatus로 매핑
      const stepToStatus: Record<string, JobStatus> = {
        research: "research",
        write: "writing",
        review: "review",
        human_review: "human_review",
        create: "creating",
        createFile: "createFile",
        validate: "validating",
        pending_deploy: "pending_deploy",
        deploy: "deploying",
        workflow: "running",
      };

      const progress = stepProgress[event.step] || 0;
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

    // Human Review 콜백
    const onHumanReview = async (state: BlogPostState & { reviewResult?: unknown }) => {
      console.log(`[Workflow] Human review requested for job ${jobId}`);

      // 상태를 human_review로 변경하고 draft_content 저장
      await jobManager.updateJob(jobId, {
        status: "human_review",
        draft_content: state.draftContent,
        review_result: state.reviewResult ?? null,
        current_step: "human_review",
        progress: 50,
      });

      await jobManager.logProgress(jobId, {
        step: "human_review",
        status: "started",
        message: "사용자 검토를 기다리는 중입니다...",
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

    // 워크플로우 실행 (PR 생성 제외)
    const result = await runBlogWorkflowWithoutDeploy(
      topic,
      onProgress,
      onHumanReview
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
        filepath: result.filepath,
        validation_result: result.validationResult as unknown,
      });

      await jobManager.logProgress(jobId, {
        step: "pending_deploy",
        status: "started",
        message: "검증 완료! PR 생성을 승인해주세요.",
        data: { filepath: result.filepath },
      });

      console.log(`[Workflow] Validation passed, waiting for deploy approval for job ${jobId}`);
    } else {
      // 검증 실패 - 완료 처리 (PR 생성 없이)
      await jobManager.updateJob(jobId, {
        status: "completed",
        progress: 100,
        current_step: "completed",
        final_content: result.finalContent,
        metadata: result.metadata as unknown,
        filepath: result.filepath,
        validation_result: result.validationResult as unknown,
      });

      await jobManager.logProgress(jobId, {
        step: "complete",
        status: "completed",
        message: "워크플로우 완료 (검증 실패로 PR 생성 건너뜀)",
        data: { validationResult: result.validationResult },
      });

      console.log(`[Workflow] Validation failed, workflow completed without PR for job ${jobId}`);
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
 * PR 생성 승인 후 배포 실행
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
      message: "PR 생성을 시작합니다...",
    });

    // Deploy 실행을 위한 상태 구성
    const state: BlogPostState = {
      topic: job.topic,
      currentStep: "deploy",
      progress: 95,
      finalContent: job.final_content || undefined,
      metadata: job.metadata as BlogPostState["metadata"],
      filepath: job.filepath || undefined,
      validationResult: job.validation_result as BlogPostState["validationResult"],
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

    // Git commit and push
    const deployResult = await gitCommitAndPush(state, onProgress);

    // 완료 처리
    await jobManager.completeJob(jobId, {
      finalContent: job.final_content || undefined,
      metadata: job.metadata as unknown as Record<string, unknown>,
      filepath: job.filepath || undefined,
      prResult: deployResult.prResult as unknown as Record<string, unknown>,
      commitHash: deployResult.commitHash,
    });

    await jobManager.logProgress(jobId, {
      step: "complete",
      status: "completed",
      message: "PR이 성공적으로 생성되었습니다!",
      data: {
        filepath: job.filepath,
        prUrl: deployResult.prResult?.prUrl,
        commitHash: deployResult.commitHash,
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
      message: `PR 생성 중 오류 발생: ${errorMessage}`,
      data: { error: errorMessage },
    });
  }
}

/**
 * PR 생성 없이 완료 처리 (반려)
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

    // 완료 처리 (PR 없이)
    await jobManager.updateJob(jobId, {
      status: "completed",
      progress: 100,
      current_step: "completed",
    });

    await jobManager.logProgress(jobId, {
      step: "complete",
      status: "completed",
      message: "PR 생성이 취소되었습니다. 파일은 로컬에 저장되어 있습니다.",
      data: { filepath: job.filepath },
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
 * PR 생성 없이 워크플로우 실행 (내부 함수)
 */
async function runBlogWorkflowWithoutDeploy(
  topic: string,
  onProgress: (event: StreamEvent) => void | Promise<void>,
  onHumanReview: (state: BlogPostState) => Promise<{ approved: boolean; feedback?: string }>
): Promise<BlogPostState> {
  // 원래 runBlogWorkflow를 호출하되, deploy 단계는 건너뛰도록 함
  // 현재 구조상 runBlogWorkflow 내부에서 deploy가 실행되므로,
  // 이를 분리하기 위해 직접 workflow 단계를 실행

  // 임시로 기존 runBlogWorkflow 사용 (deploy 포함)
  // 실제로는 deploy 단계를 분리해야 함
  const result = await runBlogWorkflow(topic, onProgress, onHumanReview);
  return result;
}
