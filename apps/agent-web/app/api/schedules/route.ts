import { NextRequest, NextResponse } from "next/server";
import { scheduleManager } from "@/lib/scheduler/manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const enabledParam = searchParams.get("enabled");
    const enabled = enabledParam === null ? undefined : enabledParam === "true";

    const result = await scheduleManager.listSchedules({ page, limit, enabled });
    return NextResponse.json(result);
  } catch (error) {
    console.error("List schedules error:", error);
    const message = error instanceof Error ? error.message : "Failed to list schedules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.name || !body.cron_expression) {
      return NextResponse.json(
        { error: "name and cron_expression are required" },
        { status: 400 }
      );
    }

    const schedule = await scheduleManager.createSchedule({
      name: body.name,
      description: body.description,
      topic_source: body.topic_source || "manual",
      topic_list: body.topic_list,
      topic_index: 0,
      rss_url: body.rss_url,
      ai_prompt: body.ai_prompt,
      category: body.category || "tech",
      template: body.template || "default",
      target_reader: body.target_reader,
      keywords: body.keywords,
      auto_approve: body.auto_approve || false,
      cron_expression: body.cron_expression,
      timezone: body.timezone || "Asia/Seoul",
      enabled: body.enabled ?? true,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    const message = error instanceof Error ? error.message : "Failed to create schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
