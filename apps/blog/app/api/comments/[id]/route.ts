import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
  password_hash?: string;
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

// GET: 대댓글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 대댓글 조회
    const { data: replies, error } = await supabase
      .from("comments")
      .select("id, post_slug, post_category, parent_id, author_name, content, is_deleted, created_at, updated_at")
      .eq("parent_id", commentId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    const replyList = (replies || []) as CommentRow[];

    return NextResponse.json({
      replies: replyList.map((reply) => ({
        id: reply.id,
        post_slug: reply.post_slug,
        post_category: reply.post_category,
        parent_id: reply.parent_id,
        author_name: reply.author_name,
        content: reply.content,
        is_deleted: reply.is_deleted,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        password_hash: "",
        author_email: null,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/comments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password, content } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // 댓글 조회 및 비밀번호 확인
    const { data: commentData, error: fetchError } = await supabase
      .from("comments")
      .select("id, password_hash, is_deleted")
      .eq("id", commentId)
      .single();

    const comment = commentData as { id: number; password_hash: string; is_deleted: boolean } | null;

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.is_deleted) {
      return NextResponse.json(
        { error: "Cannot edit deleted comment" },
        { status: 400 }
      );
    }

    if (comment.password_hash !== hashPassword(password)) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedData, error: updateError } = await supabase
      .from("comments")
      .update({ content: content.trim() })
      .eq("id", commentId)
      .select("id, post_slug, post_category, parent_id, author_name, content, is_deleted, created_at, updated_at")
      .single();

    const updatedComment = updatedData as CommentRow | null;

    if (updateError || !updatedComment) {
      console.error("Error updating comment:", updateError);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        post_slug: updatedComment.post_slug,
        post_category: updatedComment.post_category,
        parent_id: updatedComment.parent_id,
        author_name: updatedComment.author_name,
        content: updatedComment.content,
        is_deleted: updatedComment.is_deleted,
        created_at: updatedComment.created_at,
        updated_at: updatedComment.updated_at,
        password_hash: "",
        author_email: null,
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/comments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 댓글 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 댓글 조회 및 비밀번호 확인
    const { data: commentData2, error: fetchError } = await supabase
      .from("comments")
      .select("id, password_hash, is_deleted")
      .eq("id", commentId)
      .single();

    const commentToDelete = commentData2 as { id: number; password_hash: string; is_deleted: boolean } | null;

    if (fetchError || !commentToDelete) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (commentToDelete.is_deleted) {
      return NextResponse.json(
        { error: "Comment already deleted" },
        { status: 400 }
      );
    }

    if (commentToDelete.password_hash !== hashPassword(password)) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 }
      );
    }

    // 소프트 삭제 (대댓글이 있을 수 있으므로)
    const { error: deleteError } = await supabase
      .from("comments")
      .update({ is_deleted: true, content: "[삭제된 댓글입니다]" })
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/comments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
