import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import { executeWorkflow } from "@/lib/workflow/executor";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

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

    // Log initial progress
    await jobManager.logProgress(job.id, {
      step: "init",
      status: "started",
      message: "Job created and queued",
      data: {
        tone: body.tone,
        targetReader: body.targetReader,
      },
    });

    // Execute workflow in background (non-blocking)
    setImmediate(() => {
      executeWorkflow(
        job.id,
        body.topic.trim(),
        body.category || "tech",
        {
          tone: body.tone,
          targetReader: body.targetReader,
          template: body.template,
        }
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
