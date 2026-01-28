import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PostCategory, CommentWithReplies } from "@/lib/supabase/schema";
import crypto from "crypto";

interface CommentRow {
  id: number;
  post_slug: string;
  post_category: string;
  parent_id: number | null;
  author_name: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
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

// 비밀번호 해시 함수
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET: 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PostCategory;
    const slug = searchParams.get("slug");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

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

    // 최상위 댓글 조회 (cursor-based pagination)
    let query = supabase
      .from("comments")
      .select("id, post_slug, post_category, parent_id, author_name, content, is_deleted, created_at, updated_at")
      .eq("post_category", category)
      .eq("post_slug", slug)
      .is("parent_id", null)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("id", parseInt(cursor, 10));
    }

    const { data: commentsData, error } = await query;

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    const comments = (commentsData || []) as CommentRow[];

    // 각 댓글의 대댓글 수 조회
    const commentsWithReplyCounts: CommentWithReplies[] = await Promise.all(
      comments.map(async (comment) => {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", comment.id)
          .eq("is_deleted", false);

        return {
          id: comment.id,
          post_slug: comment.post_slug,
          post_category: comment.post_category as "tech" | "life",
          parent_id: comment.parent_id,
          author_name: comment.author_name,
          content: comment.content,
          is_deleted: comment.is_deleted,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          password_hash: "",
          author_email: null,
          reply_count: count || 0,
        };
      })
    );

    // 다음 페이지 존재 여부
    const hasMore = comments.length === limit;
    const nextCursor = hasMore && comments.length > 0 ? comments[comments.length - 1].id : null;

    return NextResponse.json({
      comments: commentsWithReplyCounts,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, slug, parentId, authorName, authorEmail, password, content } = body;

    // Validation
    if (!category || !slug) {
      return NextResponse.json(
        { error: "category and slug are required" },
        { status: 400 }
      );
    }

    if (!["tech", "life"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (!authorName || authorName.trim().length === 0) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    if (authorName.length > 50) {
      return NextResponse.json(
        { error: "Author name is too long (max 50 characters)" },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 부모 댓글 존재 확인 (대댓글인 경우)
    if (parentId) {
      const { data: parentData, error: parentError } = await supabase
        .from("comments")
        .select("id, is_deleted")
        .eq("id", parentId)
        .single();

      const parentComment = parentData as { id: number; is_deleted: boolean } | null;

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment.is_deleted) {
        return NextResponse.json(
          { error: "Cannot reply to deleted comment" },
          { status: 400 }
        );
      }
    }

    // 댓글 생성
    const { data: newCommentData, error } = await supabase
      .from("comments")
      .insert({
        post_category: category as PostCategory,
        post_slug: slug,
        parent_id: parentId || null,
        author_name: authorName.trim(),
        author_email: authorEmail?.trim() || null,
        password_hash: hashPassword(password),
        content: content.trim(),
      })
      .select("id, post_slug, post_category, parent_id, author_name, content, is_deleted, created_at, updated_at")
      .single();

    const newComment = newCommentData as CommentRow | null;

    if (error || !newComment) {
      console.error("Error creating comment:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comment: {
        id: newComment.id,
        post_slug: newComment.post_slug,
        post_category: newComment.post_category,
        parent_id: newComment.parent_id,
        author_name: newComment.author_name,
        content: newComment.content,
        is_deleted: newComment.is_deleted,
        created_at: newComment.created_at,
        updated_at: newComment.updated_at,
        password_hash: "",
        author_email: null,
        reply_count: 0,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
