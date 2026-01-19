import { NextResponse } from "next/server";
import { jobManager } from "@/lib/queue/job-manager";

export async function GET() {
  try {
    const stats = await jobManager.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
