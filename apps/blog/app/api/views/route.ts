import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PostCategory } from "@/lib/supabase/schema";
import crypto from "crypto";

interface ViewCount {
  view_count: number;
  unique_view_count: number;
}

// Service role client for server-side operations
function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, serviceKey);
}

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

// GET: 조회수 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PostCategory;
    const slug = searchParams.get("slug");

    if (!category || !slug) {
      return NextResponse.json(
        { error: "category and slug are required" },
        { status: 400 }
      );
    }

    if (!["tech", "life"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'tech' or 'life'" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    const { data: viewData, error } = await supabase
      .from("post_views")
      .select("view_count, unique_view_count")
      .eq("post_category", category)
      .eq("post_slug", slug)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: no rows found
      console.error("Error fetching view count:", error);
      return NextResponse.json(
        { error: "Failed to fetch view count" },
        { status: 500 }
      );
    }

    const data = viewData as ViewCount | null;

    return NextResponse.json({
      view_count: data?.view_count ?? 0,
      unique_view_count: data?.unique_view_count ?? 0,
    });
  } catch (error) {
    console.error("Error in GET /api/views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 조회수 증가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, slug, visitorId } = body;

    if (!category || !slug) {
      return NextResponse.json(
        { error: "category and slug are required" },
        { status: 400 }
      );
    }

    if (!["tech", "life"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'tech' or 'life'" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Get IP and user agent from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] || "unknown";
    const ipHash = hashIP(ip);
    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;

    // Call the increment_view_count function
    const { data: rpcData, error } = await supabase.rpc("increment_view_count", {
      p_category: category,
      p_slug: slug,
      p_visitor_id: visitorId || null,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
      p_referrer: referrer,
    });

    if (error) {
      console.error("Error incrementing view count:", error);
      return NextResponse.json(
        { error: "Failed to increment view count" },
        { status: 500 }
      );
    }

    const resultArray = rpcData as ViewCount[] | null;
    const result = resultArray?.[0] || { view_count: 1, unique_view_count: 1 };

    return NextResponse.json({
      view_count: result.view_count,
      unique_view_count: result.unique_view_count,
    });
  } catch (error) {
    console.error("Error in POST /api/views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
