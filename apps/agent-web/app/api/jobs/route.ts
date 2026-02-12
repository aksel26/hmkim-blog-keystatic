import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";
import type { JobStatus, Category, JobsListResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") as JobStatus | null;
    const category = searchParams.get("category") as Category | null;
    const search = searchParams.get("search") || undefined;

    const { jobs, total } = await jobManager.listJobs({
      page,
      limit,
      status: status || undefined,
      category: category || undefined,
      search,
    });

    const response: JobsListResponse = {
      jobs: jobs.map((job) => ({
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
        thumbnailData: job.thumbnail_data,
        filepath: job.filepath,
        prResult: job.pr_result as any,
        commitHash: job.commit_hash,
        error: job.error,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to list jobs:", error);
    return NextResponse.json(
      { error: "Failed to list jobs" },
      { status: 500 }
    );
  }
}
