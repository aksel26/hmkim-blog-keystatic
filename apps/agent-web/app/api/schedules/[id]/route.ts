import { NextRequest, NextResponse } from "next/server";
import { scheduleManager } from "@/lib/scheduler/manager";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const schedule = await scheduleManager.getSchedule(id);

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Get schedule error:", error);
    const message = error instanceof Error ? error.message : "Failed to get schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const schedule = await scheduleManager.updateSchedule(id, {
      name: body.name,
      description: body.description,
      topic_source: body.topic_source,
      topic_list: body.topic_list,
      rss_url: body.rss_url,
      ai_prompt: body.ai_prompt,
      category: body.category,
      template: body.template,
      target_reader: body.target_reader,
      keywords: body.keywords,
      auto_approve: body.auto_approve,
      cron_expression: body.cron_expression,
      timezone: body.timezone,
      enabled: body.enabled,
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    const message = error instanceof Error ? error.message : "Failed to update schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await scheduleManager.deleteSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete schedule error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
