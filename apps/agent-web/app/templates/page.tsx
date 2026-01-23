"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { TemplatesListResponse } from "@/lib/templates/types";
import { ChevronDown, ChevronUp } from "lucide-react";

async function fetchTemplates(): Promise<TemplatesListResponse> {
  const res = await fetch("/api/templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete template");
  }
}

async function setDefaultTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_default: true }),
  });
  if (!res.ok) throw new Error("Failed to set default template");
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const handleDelete = (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      alert("기본 템플릿은 삭제할 수 없습니다.");
      return;
    }
    if (confirm(`정말 "${name}" 템플릿을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">이메일 템플릿</h1>
          <p className="text-gray-500 text-sm">뉴스레터 이메일 템플릿을 관리합니다</p>
        </div>
        <Link
          href="/templates/new"
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition"
        >
          새 템플릿 만들기
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-8 mb-12 text-sm">
        <div className="text-gray-500">
          전체 <span className="text-white font-medium ml-2">{data?.total ?? 0}</span>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 font-light">
          목록을 불러오는 중...
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 font-light">
          템플릿 목록을 불러오는데 실패했습니다.
        </div>
      ) : data?.templates && data.templates.length > 0 ? (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
            <div className="col-span-3">이름</div>
            <div className="col-span-5">제목</div>
            <div className="col-span-2">수정일</div>
            <div className="col-span-2 text-right">작업</div>
          </div>

          {/* Table Rows */}
          {data.templates.map((template) => (
            <div key={template.id}>
              <div className="group grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="font-medium text-gray-200">{template.name}</span>
                  {template.is_default && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                      기본
                    </span>
                  )}
                </div>
                <div className="col-span-5 text-gray-400 text-sm truncate">
                  {template.subject}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {formatRelativeTime(template.updated_at)}
                </div>
                <div className="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    미리보기
                    {expandedId === template.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <Link
                    href={`/templates/${template.id}/edit`}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    편집
                  </Link>
                  {!template.is_default && (
                    <>
                      <button
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        disabled={setDefaultMutation.isPending}
                        className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        기본설정
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.name, template.is_default)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Panel */}
              {expandedId === template.id && (
                <div className="px-4 py-6 bg-gray-900/20 border-b border-gray-800">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">미리보기</div>
                  <div
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm max-h-80 overflow-auto prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: template.body }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 font-light">
          <p className="mb-4">등록된 템플릿이 없습니다.</p>
          <Link
            href="/templates/new"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            첫 번째 템플릿 만들기
          </Link>
        </div>
      )}
    </div>
  );
}
