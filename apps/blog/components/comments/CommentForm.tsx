"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  category: "tech" | "life";
  slug: string;
  parentId?: number;
  onSuccess?: (comment: unknown) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  category,
  slug,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "댓글을 작성해주세요...",
}: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authorName.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }

    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다");
      return;
    }

    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          slug,
          parentId,
          authorName: authorName.trim(),
          password,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "댓글 작성에 실패했습니다");
        return;
      }

      // 성공 시 폼 초기화
      setAuthorName("");
      setPassword("");
      setContent("");
      onSuccess?.(data.comment);
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="닉네임"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="비밀번호 (수정/삭제용)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      <div className="relative">
        <textarea
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
        />
        <span className="absolute bottom-2 right-2 text-xs text-gray-400">
          {content.length}/2000
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {parentId ? "답글 작성" : "댓글 작성"}
        </button>
      </div>
    </form>
  );
}
