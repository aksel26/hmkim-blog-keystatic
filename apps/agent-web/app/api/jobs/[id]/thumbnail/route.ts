import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import { generateThumbnail } from "@agent/ai-agents/tools/thumbnail-generator";
import type { PostMetadata, Category } from "@agent/ai-agents/types/workflow";

/**
 * POST /api/jobs/[id]/thumbnail
 * 썸네일 재생성 (커스텀 프롬프트 지원)
 */
export async function POST(
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

    if (!["human_review", "pending_deploy"].includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot regenerate thumbnail in ${job.status} status.` },
        { status: 400 }
      );
    }

    const metadata = job.metadata as PostMetadata | null;
    if (!metadata) {
      return NextResponse.json(
        { error: "Job has no metadata" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customPrompt = body.prompt as string | undefined;

    const result = await generateThumbnail(
      metadata,
      (job.category || "tech") as Category,
      undefined,
      customPrompt,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Thumbnail generation failed" },
        { status: 500 }
      );
    }

    // DB 업데이트
    await jobManager.updateJob(jobId, {
      thumbnail_data: result.buffer,
      metadata: {
        ...metadata,
        thumbnailImage: result.path,
      },
    });

    await jobManager.logProgress(jobId, {
      step: "thumbnail",
      status: "completed",
      message: customPrompt
        ? "커스텀 프롬프트로 썸네일을 재생성했습니다."
        : "썸네일을 재생성했습니다.",
    });

    return NextResponse.json({
      success: true,
      thumbnailData: result.buffer,
      mimeType: result.mimeType,
      path: result.path,
    });
  } catch (error) {
    console.error("Failed to regenerate thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to regenerate thumbnail" },
      { status: 500 }
    );
  }
}
