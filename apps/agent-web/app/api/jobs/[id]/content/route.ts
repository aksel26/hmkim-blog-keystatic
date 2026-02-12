import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";

/**
 * PATCH /api/jobs/[id]/content
 * human_review 상태에서 콘텐츠 직접 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await jobManager.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "human_review") {
      return NextResponse.json(
        { error: `Cannot edit content in ${job.status} status. Only human_review status is allowed.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { finalContent, metadata } = body;

    if (typeof finalContent !== "string" || !finalContent.trim()) {
      return NextResponse.json(
        { error: "finalContent is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      final_content: finalContent,
    };

    if (metadata) {
      updates.metadata = metadata;
    }

    await jobManager.updateJob(jobId, updates);

    await jobManager.logProgress(jobId, {
      step: "human_review",
      status: "progress",
      message: "사용자가 콘텐츠를 직접 수정했습니다.",
    });

    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
      jobId,
    });
  } catch (error) {
    console.error("Failed to update content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
