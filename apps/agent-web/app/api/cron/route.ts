import { NextRequest, NextResponse } from "next/server";
import { scheduleManager } from "@/lib/scheduler/manager";
import { jobManager } from "@/lib/queue/job-manager";
import { executeWorkflow } from "@/lib/workflow/executor";
import type { Template } from "@/lib/types";

// Vercel Cron secret 검증
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET is not set");
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authHeader.slice(7);
  return providedSecret === cronSecret;
}

export async function GET(request: NextRequest) {
  try {
    // Cron secret 검증
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 실행 예정인 스케줄 조회
    const dueSchedules = await scheduleManager.getDueSchedules();

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: "No schedules due",
        processed: 0,
      });
    }

    const results: Array<{
      scheduleId: string;
      scheduleName: string;
      jobId?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const schedule of dueSchedules) {
      try {
        // 다음 토픽 가져오기
        const topic = await scheduleManager.getNextTopic(schedule);

        if (!topic) {
          results.push({
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            success: false,
            error: "No topic available",
          });
          await scheduleManager.markAsRun(schedule.id, "", false, "No topic available");
          continue;
        }

        // 작업 생성
        const validTemplates: Template[] = ["tutorial", "comparison", "deep-dive", "tips", "default"];
        const template = validTemplates.includes(schedule.template as Template)
          ? (schedule.template as Template)
          : undefined;

        const job = await jobManager.createJob({
          topic,
          category: schedule.category,
          template,
        });

        // 컨텍스트 생성
        const contextParts = [topic];
        if (schedule.target_reader) {
          contextParts.push(`타겟 독자: ${schedule.target_reader}`);
        }
        if (schedule.keywords && schedule.keywords.length > 0) {
          contextParts.push(`핵심 키워드: ${schedule.keywords.join(", ")}`);
        }
        const context = contextParts.join("\n");

        // 초기 로그 기록
        await jobManager.logProgress(job.id, {
          step: "init",
          status: "started",
          message: `Scheduled job created from schedule: ${schedule.name}`,
          data: {
            scheduleId: schedule.id,
            targetReader: schedule.target_reader,
            keywords: schedule.keywords,
            autoApprove: schedule.auto_approve,
          },
        });

        // 워크플로우 백그라운드 실행
        setImmediate(() => {
          executeWorkflow(job.id, context, schedule.category).catch((error) => {
            console.error(`Background workflow failed for scheduled job ${job.id}:`, error);
          });
        });

        // 스케줄 실행 완료 처리
        await scheduleManager.markAsRun(schedule.id, job.id, true);

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          jobId: job.id,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: false,
          error: errorMessage,
        });
        await scheduleManager.markAsRun(schedule.id, "", false, errorMessage);
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} schedules`,
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Cron execution error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute cron";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
