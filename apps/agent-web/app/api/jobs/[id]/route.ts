import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import type { Job, JobStatus, Category } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const job = await jobManager.getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Also get progress logs
    const progressLogs = await jobManager.getProgressLogs(id);

    const response: Job & { progressLogs: typeof progressLogs } = {
      id: job.id,
      topic: job.topic,
      category: job.category as Category,
      template: job.template as any,
      status: job.status as JobStatus,
      currentStep: job.current_step,
      progress: job.progress,
      researchData: job.research_data as any,
      draftContent: job.draft_content,
      finalContent: job.final_content,
      metadata: job.metadata as any,
      reviewResult: job.review_result as any,
      validationResult: job.validation_result as any,
      humanApproval: job.human_approval,
      humanFeedback: job.human_feedback,
      filepath: job.filepath,
      prResult: job.pr_result as any,
      commitHash: job.commit_hash,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      progressLogs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get job:", error);
    return NextResponse.json(
      { error: "Failed to get job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    await jobManager.deleteJob(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
