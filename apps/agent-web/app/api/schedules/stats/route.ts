import { NextResponse } from "next/server";
import { scheduleManager } from "@/lib/scheduler/manager";

export async function GET() {
  try {
    const stats = await scheduleManager.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Get schedule stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to get stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
