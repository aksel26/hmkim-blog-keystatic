import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, serviceKey);
}

export async function GET() {
  try {
    const supabase = getServiceClient();

    const [totalResult, todayResult] = await Promise.all([
      supabase.from("post_views").select("view_count"),
      supabase
        .from("post_view_logs")
        .select("id", { count: "exact", head: true })
        .gte("viewed_at", new Date().toISOString().slice(0, 10)),
    ]);

    if (totalResult.error) {
      console.error("Error fetching total views:", totalResult.error);
      return NextResponse.json(
        { error: "Failed to fetch total views" },
        { status: 500 }
      );
    }

    const totalViews = (totalResult.data ?? []).reduce(
      (sum: number, row: { view_count: number }) => sum + row.view_count,
      0
    );

    const todayViews = todayResult.count ?? 0;

    return NextResponse.json({
      total_views: totalViews,
      today_views: todayViews,
    });
  } catch (error) {
    console.error("Error in GET /api/views/total:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
