import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";

/**
 * POST /api/jobs/[id]/hold
 * Job을 보류(on_hold) 상태로 변경
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Job 존재 확인
    const job = await jobManager.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // human_review 상태에서만 보류 가능
    if (job.status !== "human_review") {
      return NextResponse.json(
        { error: `Cannot hold job in ${job.status} status. Only human_review status is allowed.` },
        { status: 400 }
      );
    }

    // 상태를 on_hold로 변경
    await jobManager.updateJob(jobId, {
      status: "on_hold",
      current_step: "on_hold",
    });

    // 진행 상황 로그 기록
    await jobManager.logProgress(jobId, {
      step: "on_hold",
      status: "progress",
      message: "작업이 보류 상태로 변경되었습니다.",
    });

    return NextResponse.json({
      success: true,
      message: "Job has been put on hold",
      jobId,
      status: "on_hold",
    });
  } catch (error) {
    console.error("Failed to hold job:", error);
    return NextResponse.json(
      { error: "Failed to hold job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]/hold
 * Job을 보류 상태에서 해제하여 human_review로 복귀
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Job 존재 확인
    const job = await jobManager.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // on_hold 상태에서만 해제 가능
    if (job.status !== "on_hold") {
      return NextResponse.json(
        { error: `Cannot resume job in ${job.status} status. Only on_hold status is allowed.` },
        { status: 400 }
      );
    }

    // 상태를 human_review로 복귀
    await jobManager.updateJob(jobId, {
      status: "human_review",
      current_step: "human_review",
    });

    // 진행 상황 로그 기록
    await jobManager.logProgress(jobId, {
      step: "human_review",
      status: "progress",
      message: "보류가 해제되었습니다. 검토를 계속해주세요.",
    });

    return NextResponse.json({
      success: true,
      message: "Job has been resumed from hold",
      jobId,
      status: "human_review",
    });
  } catch (error) {
    console.error("Failed to resume job from hold:", error);
    return NextResponse.json(
      { error: "Failed to resume job" },
      { status: 500 }
    );
  }
}
