import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { jobManager } from "@/lib/queue/job-manager";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: jobId } = await context.params;

  // Verify job exists
  const job = await jobManager.getJob(jobId);
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = createServerClient();

      // Send initial status
      const sendEvent = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send current job state
      sendEvent({
        type: "progress",
        step: job.current_step || "init",
        status: job.status,
        message: `Current status: ${job.status}`,
        progress: job.progress,
      });

      // If job is already completed or failed, close the stream
      if (job.status === "completed" || job.status === "failed") {
        if (job.status === "completed") {
          sendEvent({
            type: "complete",
            filepath: job.filepath,
            prResult: job.pr_result,
            metadata: job.metadata,
          });
        } else {
          sendEvent({
            type: "error",
            message: job.error || "Job failed",
            step: job.current_step || "unknown",
          });
        }
        controller.close();
        return;
      }

      // Subscribe to progress logs for real-time updates
      const channel = supabase
        .channel(`job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "progress_logs",
            filter: `job_id=eq.${jobId}`,
          },
          (payload) => {
            const log = payload.new as {
              step: string;
              status: string;
              message: string;
              data: any;
            };

            sendEvent({
              type: "progress",
              step: log.step,
              status: log.status,
              message: log.message,
              progress: log.data?.progress || 0,
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${jobId}`,
          },
          async (payload) => {
            const updatedJob = payload.new as typeof job;

            // Check for human review required
            if (updatedJob.status === "human_review") {
              sendEvent({
                type: "review-required",
                draftContent: updatedJob.draft_content,
                reviewResult: updatedJob.review_result,
              });
            }

            // Check for completion
            if (updatedJob.status === "completed") {
              sendEvent({
                type: "complete",
                filepath: updatedJob.filepath,
                prResult: updatedJob.pr_result,
                metadata: updatedJob.metadata,
              });
              channel.unsubscribe();
              controller.close();
            }

            // Check for failure
            if (updatedJob.status === "failed") {
              sendEvent({
                type: "error",
                message: updatedJob.error || "Job failed",
                step: updatedJob.current_step || "unknown",
              });
              channel.unsubscribe();
              controller.close();
            }
          }
        )
        .subscribe();

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        channel.unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
