"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatRelativeTime } from "@/lib/utils";
import type { SubscribersListResponse, SubscriberStats } from "@/lib/subscribers/types";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const statusOptions = [
  { value: "", label: "전체" },
  { value: "active", label: "활성" },
  { value: "unsubscribed", label: "해지" },
];

async function fetchSubscribers(params: {
  page: number;
  status?: string;
  search?: string;
}): Promise<SubscribersListResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "20",
  });

  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`/api/subscribers?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch subscribers");
  return res.json();
}

async function fetchStats(): Promise<SubscriberStats> {
  const res = await fetch("/api/subscribers/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function deleteSubscriber(id: string): Promise<void> {
  const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete subscriber");
}

async function updateSubscriberStatus(
  id: string,
  status: "active" | "unsubscribed"
): Promise<void> {
  const res = await fetch(`/api/subscribers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update subscriber");
}

export default function SubscribersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["subscriber-stats"],
    queryFn: fetchStats,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscribers", page, status, search],
    queryFn: () => fetchSubscribers({ page, status, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["subscriber-stats"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "unsubscribed" }) =>
      updateSubscriberStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["subscriber-stats"] });
    },
  });

  const handleDelete = (id: string, email: string) => {
    if (confirm(`정말 ${email} 구독자를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "unsubscribed" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">구독자 관리</h1>
          <p className="text-gray-500 text-sm">뉴스레터 구독자를 관리합니다</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-8 mb-12 text-sm">
          <div className="text-gray-500">
            전체 <span className="text-white font-medium ml-2">{stats.total}</span>
          </div>
          <div className="text-gray-500">
            활성 <span className="text-green-400 font-medium ml-2">{stats.active}</span>
          </div>
          <div className="text-gray-500">
            해지 <span className="text-gray-400 font-medium ml-2">{stats.unsubscribed}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-gray-600 placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-6 border-b border-gray-800 pb-1 sm:border-0 sm:pb-0">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatus(opt.value);
                setPage(1);
              }}
              className={`pb-3 sm:pb-0 text-sm transition-colors relative ${
                status === opt.value
                  ? "text-white font-medium"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
              {status === opt.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white sm:hidden" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subscribers List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 font-light">
          목록을 불러오는 중...
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 font-light">
          구독자 목록을 불러오는데 실패했습니다.
        </div>
      ) : data?.subscribers && data.subscribers.length > 0 ? (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
            <div className="col-span-4">이메일</div>
            <div className="col-span-2">이름</div>
            <div className="col-span-2 text-center">상태</div>
            <div className="col-span-2">구독일</div>
            <div className="col-span-2 text-right">작업</div>
          </div>

          {/* Table Rows */}
          {data.subscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="group grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-gray-800 hover:bg-gray-900/30 transition-colors"
            >
              <div className="col-span-4">
                <span className="font-medium text-gray-200 truncate block">
                  {subscriber.email}
                </span>
              </div>
              <div className="col-span-2 text-gray-400">
                {subscriber.name || "-"}
              </div>
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => handleToggleStatus(subscriber.id, subscriber.status)}
                  disabled={toggleStatusMutation.isPending}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    subscriber.status === "active"
                      ? "bg-green-900/20 text-green-400 hover:bg-green-900/40"
                      : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                  }`}
                >
                  {subscriber.status === "active" ? "활성" : "해지"}
                </button>
              </div>
              <div className="col-span-2 text-sm text-gray-400">
                {formatRelativeTime(subscriber.subscribed_at)}
              </div>
              <div className="col-span-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(subscriber.id, subscriber.email)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-gray-500">
                {data.pagination.page} / {data.pagination.totalPages} 페이지
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 font-light">
          등록된 구독자가 없습니다.
        </div>
      )}
    </div>
  );
}
