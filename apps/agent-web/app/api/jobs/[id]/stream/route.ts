import { NextRequest } from "next/server";
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

  // Create SSE stream with polling
  const encoder = new TextEncoder();
  let lastLogId = 0;
  let isClosed = false;
  let lastStatus = job.status; // 상태 변경 추적

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          isClosed = true;
        }
      };

      // Send initial status
      sendEvent({
        type: "progress",
        step: job.current_step || "init",
        status: job.status, // job의 실제 status
        logStatus: "progress",
        message: `Current status: ${job.status}`,
        progress: job.progress,
      });

      // Handle initial terminal/special states
      if (job.status === "completed") {
        sendEvent({
          type: "complete",
          filepath: job.filepath,
          prResult: job.pr_result,
          metadata: job.metadata,
        });
        controller.close();
        return;
      }

      if (job.status === "failed") {
        sendEvent({
          type: "error",
          message: job.error || "Job failed",
          step: job.current_step || "unknown",
        });
        controller.close();
        return;
      }

      // If already in human_review, send review-required immediately
      if (job.status === "human_review") {
        sendEvent({
          type: "review-required",
          draftContent: job.draft_content,
          reviewResult: job.review_result,
        });
      }

      // If already in pending_deploy, send pending-deploy event
      if (job.status === "pending_deploy") {
        sendEvent({
          type: "pending-deploy",
          filepath: job.filepath,
          metadata: job.metadata,
        });
      }

      // Polling function
      const pollForUpdates = async () => {
        if (isClosed) return;

        try {
          // Get current job status
          const currentJob = await jobManager.getJob(jobId);
          if (!currentJob) {
            sendEvent({
              type: "error",
              message: "Job not found",
              step: "unknown",
            });
            isClosed = true;
            controller.close();
            return;
          }

          // Get new progress logs
          const allLogs = await jobManager.getProgressLogs(jobId);
          const newLogs = allLogs.filter((log) => log.id > lastLogId);

          // Send new log events
          for (const log of newLogs) {
            sendEvent({
              type: "progress",
              step: log.step,
              status: currentJob.status, // job의 실제 status 사용
              logStatus: log.status, // 로그 status는 별도로
              message: log.message,
              progress: log.data?.progress || currentJob.progress,
            });
            lastLogId = log.id;
          }

          // 특수 상태면 항상 해당 이벤트 전송 (상태 변경 여부와 관계없이)
          // 클라이언트가 연결 후 상태를 놓치는 경우를 방지
          if (currentJob.status === "human_review") {
            sendEvent({
              type: "review-required",
              draftContent: currentJob.draft_content,
              reviewResult: currentJob.review_result,
            });
          }

          if (currentJob.status === "pending_deploy") {
            sendEvent({
              type: "pending-deploy",
              filepath: currentJob.filepath,
              metadata: currentJob.metadata,
            });
          }

          // 상태 변경 추적 (로깅용)
          if (currentJob.status !== lastStatus) {
            lastStatus = currentJob.status;
          }

          // Check for completion
          if (currentJob.status === "completed") {
            sendEvent({
              type: "complete",
              filepath: currentJob.filepath,
              prResult: currentJob.pr_result,
              metadata: currentJob.metadata,
            });
            isClosed = true;
            controller.close();
            return;
          }

          // Check for failure
          if (currentJob.status === "failed") {
            sendEvent({
              type: "error",
              message: currentJob.error || "Job failed",
              step: currentJob.current_step || "unknown",
            });
            isClosed = true;
            controller.close();
            return;
          }

          // Continue polling if still running
          if (!isClosed) {
            setTimeout(pollForUpdates, 2000); // Poll every 2 seconds
          }
        } catch (error) {
          console.error("Polling error:", error);
          if (!isClosed) {
            setTimeout(pollForUpdates, 3000); // Retry after 3 seconds on error
          }
        }
      };

      // Start polling
      pollForUpdates();

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        try {
          controller.close();
        } catch {
          // Already closed
        }
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
