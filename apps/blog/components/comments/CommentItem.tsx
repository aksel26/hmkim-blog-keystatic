"use client";

import { useState } from "react";
import { MessageCircle, Edit2, Trash2, ChevronDown, ChevronUp, Loader2, User } from "lucide-react";
import { CommentWithReplies } from "@/lib/supabase/schema";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: CommentWithReplies;
  category: "tech" | "life";
  slug: string;
  onUpdate?: (comment: CommentWithReplies) => void;
  onDelete?: (commentId: number) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  category,
  slug,
  onUpdate,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentWithReplies[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [deletePassword, setDeletePassword] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const loadReplies = async () => {
    if (isLoadingReplies) return;

    setIsLoadingReplies(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      }
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    if (!showReplies && replies.length === 0 && comment.reply_count && comment.reply_count > 0) {
      await loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReplySuccess = (newReply: unknown) => {
    setReplies((prev) => [...prev, newReply as CommentWithReplies]);
    setShowReplyForm(false);
    setShowReplies(true);
    if (onUpdate) {
      onUpdate({
        ...comment,
        reply_count: (comment.reply_count || 0) + 1,
      });
    }
  };

  const handleEdit = async () => {
    if (!editPassword) {
      setError("비밀번호를 입력해주세요");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editPassword,
          content: editContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "수정에 실패했습니다");
        return;
      }

      setShowEditForm(false);
      setEditPassword("");
      if (onUpdate) {
        onUpdate(data.comment);
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setError("비밀번호를 입력해주세요");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "삭제에 실패했습니다");
        return;
      }

      setShowDeleteConfirm(false);
      setDeletePassword("");
      if (onDelete) {
        onDelete(comment.id);
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`${isReply ? "ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-gray-200 dark:border-gray-700" : ""} overflow-hidden`}>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{comment.author_name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(comment.created_at)}</span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-gray-400 flex-shrink-0">(수정됨)</span>
          )}
        </div>

        {/* Content */}
        {showEditForm ? (
          <div className="mt-2 space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="비밀번호"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full sm:w-auto min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 rounded-lg touch-manipulation"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "수정"}
                </button>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditContent(comment.content);
                    setEditPassword("");
                    setError(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 touch-manipulation"
                >
                  취소
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">정말 삭제하시겠습니까?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="비밀번호"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full sm:w-auto min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-red-300 rounded-lg touch-manipulation"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "삭제"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setError(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 touch-manipulation"
                >
                  취소
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* Actions */}
        {!showEditForm && !showDeleteConfirm && !comment.is_deleted && (
          <div className="flex items-center gap-3 sm:gap-4 mt-3">
            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-500 active:text-blue-600 transition-colors touch-manipulation rounded-md"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                답글
              </button>
            )}
            <button
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-500 active:text-blue-600 transition-colors touch-manipulation rounded-md"
            >
              <Edit2 className="w-3.5 h-3.5" />
              수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-red-500 active:text-red-600 transition-colors touch-manipulation rounded-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </button>
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 pl-3 sm:pl-4 border-l-2 border-blue-200 dark:border-blue-700">
            <CommentForm
              category={category}
              slug={slug}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
              placeholder="답글을 작성해주세요..."
            />
          </div>
        )}

        {/* Replies Toggle */}
        {!isReply && comment.reply_count && comment.reply_count > 0 && (
          <button
            onClick={toggleReplies}
            className="inline-flex items-center gap-1 mt-3 text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            {isLoadingReplies ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : showReplies ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showReplies ? "답글 숨기기" : `답글 ${comment.reply_count}개 보기`}
          </button>
        )}

        {/* Replies List */}
        {showReplies && replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                category={category}
                slug={slug}
                isReply
                onUpdate={(updated) => {
                  setReplies((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                  );
                }}
                onDelete={(deletedId) => {
                  setReplies((prev) => prev.filter((r) => r.id !== deletedId));
                  if (onUpdate) {
                    onUpdate({
                      ...comment,
                      reply_count: Math.max(0, (comment.reply_count || 1) - 1),
                    });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
