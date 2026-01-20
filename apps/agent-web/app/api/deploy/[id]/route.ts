import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import { executeDeploy, skipDeploy } from "@/lib/workflow/executor";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: jobId } = await context.params;
    const body = await request.json();

    // Validate request
    if (!body.action || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: approve, reject" },
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

    // Verify job is in pending_deploy status (check both status and current_step for timing issues)
    if (job.status !== "pending_deploy" && job.current_step !== "pending_deploy") {
      return NextResponse.json(
        { error: `Job is not awaiting deploy approval. Current status: ${job.status}` },
        { status: 400 }
      );
    }

    if (body.action === "approve") {
      // Execute deploy in background
      setImmediate(() => {
        executeDeploy(jobId).catch((error) => {
          console.error(`Background deploy failed for job ${jobId}:`, error);
        });
      });

      return NextResponse.json({
        success: true,
        message: "PR 생성이 시작되었습니다.",
        nextStatus: "deploying",
      });
    } else {
      // Skip deploy
      await skipDeploy(jobId);

      return NextResponse.json({
        success: true,
        message: "PR 생성이 취소되었습니다.",
        nextStatus: "completed",
      });
    }
  } catch (error) {
    console.error("Failed to process deploy action:", error);
    return NextResponse.json(
      { error: "Failed to process deploy action" },
      { status: 500 }
    );
  }
}
