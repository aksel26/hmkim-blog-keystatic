import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PostCategory } from "@/lib/supabase/schema";

interface ToggleLikeResult {
  like_count: number;
  liked: boolean;
}

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, serviceKey);
}

function isValidCategory(value: string | null): value is PostCategory {
  return value === "tech" || value === "life";
}

// GET: 좋아요 수 + 현재 방문자의 좋아요 여부 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");
    const visitorId = searchParams.get("visitorId");

    if (!category || !slug) {
      return NextResponse.json(
        { error: "category and slug are required" },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'tech' or 'life'" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    const [likeResult, logResult] = await Promise.all([
      supabase
        .from("post_likes")
        .select("like_count")
        .eq("post_category", category)
        .eq("post_slug", slug)
        .maybeSingle(),
      visitorId
        ? supabase
            .from("post_like_logs")
            .select("id")
            .eq("post_category", category)
            .eq("post_slug", slug)
            .eq("visitor_id", visitorId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (likeResult.error) {
      console.error("Error fetching like count:", likeResult.error);
      return NextResponse.json(
        { error: "Failed to fetch like count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      like_count: likeResult.data?.like_count ?? 0,
      liked: Boolean(logResult.data),
    });
  } catch (error) {
    console.error("Error in GET /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 좋아요 토글 (있으면 취소, 없으면 추가)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, slug, visitorId } = body;

    if (!category || !slug || !visitorId) {
      return NextResponse.json(
        { error: "category, slug, and visitorId are required" },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'tech' or 'life'" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase.rpc("toggle_post_like", {
      p_category: category,
      p_slug: slug,
      p_visitor_id: visitorId,
    });

    if (error) {
      console.error("Error toggling like:", error);
      return NextResponse.json(
        { error: "Failed to toggle like" },
        { status: 500 }
      );
    }

    const resultArray = data as ToggleLikeResult[] | null;
    const result = resultArray?.[0] ?? { like_count: 0, liked: false };

    return NextResponse.json({
      like_count: result.like_count,
      liked: result.liked,
    });
  } catch (error) {
    console.error("Error in POST /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
