import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import type { PostMetadata } from "@agent/ai-agents/types/workflow";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/jobs/[id]/thumbnail/upload
 * 사용자 이미지 파일 업로드로 썸네일 교체
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await jobManager.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!["human_review", "pending_deploy"].includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot upload thumbnail in ${job.status} status.` },
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    // base64 변환
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 확장자 결정
    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/webp"
          ? "webp"
          : "png";
    const slug = metadata.slug || "new-post";
    const imagePath = `/images/thumbnails/${slug}/thumbnailImage.${ext}`;

    // DB 업데이트
    await jobManager.updateJob(jobId, {
      thumbnail_data: base64Data,
      metadata: {
        ...metadata,
        thumbnailImage: imagePath,
      },
    });

    await jobManager.logProgress(jobId, {
      step: "thumbnail",
      status: "completed",
      message: "사용자가 업로드한 이미지로 썸네일을 교체했습니다.",
    });

    return NextResponse.json({
      success: true,
      thumbnailData: base64Data,
      mimeType: file.type,
      path: imagePath,
    });
  } catch (error) {
    console.error("Failed to upload thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}
