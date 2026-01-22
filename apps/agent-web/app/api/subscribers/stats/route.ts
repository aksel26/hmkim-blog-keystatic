import { NextResponse } from "next/server";
import { subscriberManager } from "@/lib/subscribers/manager";

export async function GET() {
  try {
    const stats = await subscriberManager.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Get subscriber stats error:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
