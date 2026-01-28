"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { CommentWithReplies } from "@/lib/supabase/schema";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  category: "tech" | "life";
  slug: string;
}

export function CommentSection({ category, slug }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (cursor?: number) => {
    try {
      const url = new URL("/api/comments", window.location.origin);
      url.searchParams.set("category", category);
      url.searchParams.set("slug", slug);
      if (cursor) {
        url.searchParams.set("cursor", cursor.toString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching comments:", err);
      throw err;
    }
  }, [category, slug]);

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchComments();
        setComments(data.comments || []);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError("댓글을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [fetchComments]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchComments(nextCursor);
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading more comments:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleNewComment = (newComment: unknown) => {
    setComments((prev) => [newComment as CommentWithReplies, ...prev]);
  };

  const handleUpdateComment = (updated: CommentWithReplies) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleDeleteComment = (deletedId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedId));
  };

  return (
    <div data-comment-section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold">댓글</h2>
        {!isLoading && (
          <span className="text-sm text-gray-500">({comments.length})</span>
        )}
      </div>

      {/* Comment Form */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <CommentForm
          category={category}
          slug={slug}
          onSuccess={handleNewComment}
        />
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600"
          >
            다시 시도
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">아직 댓글이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">첫 번째 댓글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              category={category}
              slug={slug}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              "더 보기"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
