import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import type { HumanReviewRequest, HumanReviewResponse } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: jobId } = await context.params;
    const body: HumanReviewRequest = await request.json();

    // Validate request
    if (!body.action || !["approve", "feedback", "rewrite"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: approve, feedback, rewrite" },
        { status: 400 }
      );
    }

    // Get current job
    const job = await jobManager.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify job is in human_review status
    // Check status, current_step, or progress_logs for timing issues
    const isHumanReview =
      job.status === "human_review" ||
      job.current_step === "human_review";

    if (!isHumanReview) {
      // Also check progress_logs for human_review step
      const logs = await jobManager.getProgressLogs(jobId);
      const hasHumanReviewLog = logs.some(
        log => log.step === "human_review" || log.step === "review"
      );

      if (!hasHumanReviewLog) {
        return NextResponse.json(
          { error: "Job is not awaiting human review" },
          { status: 400 }
        );
      }
    }

    let nextStep: string;

    switch (body.action) {
      case "approve":
        // Human review 승인 시 바로 pending_deploy로 전환
        // (polling 프로세스가 죽어도 진행 가능하도록)
        await jobManager.updateJob(jobId, {
          human_approval: true,
          human_feedback: null,
          status: "pending_deploy",
          current_step: "pending_deploy",
          progress: 90,
        });

        await jobManager.logProgress(jobId, {
          step: "human_review",
          status: "completed",
          message: "Human review: approve",
        });

        await jobManager.logProgress(jobId, {
          step: "pending_deploy",
          status: "started",
          message: "검증 완료! 배포를 승인해주세요.",
        });

        nextStep = "pending_deploy";
        break;

      case "feedback":
      case "rewrite":
        if (!body.feedback || body.feedback.trim() === "") {
          return NextResponse.json(
            { error: "Feedback is required for this action" },
            { status: 400 }
          );
        }
        await jobManager.submitHumanReview(jobId, false, body.feedback.trim());

        await jobManager.logProgress(jobId, {
          step: "human_review",
          status: "completed",
          message: `Human review: ${body.action}`,
          data: { feedback: body.feedback },
        });

        nextStep = "writing";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const response: HumanReviewResponse = {
      success: true,
      nextStep,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to submit human review:", error);
    return NextResponse.json(
      { error: "Failed to submit human review" },
      { status: 500 }
    );
  }
}
