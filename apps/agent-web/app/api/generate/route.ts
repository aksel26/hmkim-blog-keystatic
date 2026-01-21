import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import { executeWorkflow } from "@/lib/workflow/executor";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

/**
 * 컨텍스트 빌드 함수
 */
function buildContext(body: GenerateRequest): string {
  const parts: string[] = [body.topic];

  if (body.tone) {
    const toneMap: Record<string, string> = {
      formal: "격식체",
      casual: "편한체",
      friendly: "친근체",
      professional: "전문가체",
    };
    parts.push(`말투: ${toneMap[body.tone] || body.tone}`);
  }

  if (body.targetReader) {
    parts.push(`타겟 독자: ${body.targetReader}`);
  }

  if (body.keywords && body.keywords.length > 0) {
    parts.push(`핵심 키워드: ${body.keywords.join(", ")}`);
  }

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // Validate request
    if (!body.topic || typeof body.topic !== "string" || body.topic.trim() === "") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Create job
    const job = await jobManager.createJob({
      topic: body.topic.trim(),
      category: body.category || "tech",
      template: body.template,
    });

    // 컨텍스트 생성
    const context = buildContext(body);

    // Log initial progress
    await jobManager.logProgress(job.id, {
      step: "init",
      status: "started",
      message: "Job created and queued",
      data: {
        tone: body.tone,
        targetReader: body.targetReader,
        keywords: body.keywords,
      },
    });

    // Execute workflow in background (non-blocking)
    setImmediate(() => {
      executeWorkflow(
        job.id,
        context,
        body.category || "tech"
      ).catch((error) => {
        console.error(`Background workflow failed for job ${job.id}:`, error);
      });
    });

    const response: GenerateResponse = {
      jobId: job.id,
      status: "queued",
      streamUrl: `/api/jobs/${job.id}/stream`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
