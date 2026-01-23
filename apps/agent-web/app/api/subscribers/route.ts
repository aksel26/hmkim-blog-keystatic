import { NextRequest, NextResponse } from "next/server";
import { subscriberManager } from "@/lib/subscribers/manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as "active" | "unsubscribed" | null;
    const search = searchParams.get("search") || undefined;

    const result = await subscriberManager.listSubscribers({
      page,
      limit,
      status: status || undefined,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List subscribers error:", error);
    return NextResponse.json(
      { error: "Failed to list subscribers" },
      { status: 500 }
    );
  }
}
