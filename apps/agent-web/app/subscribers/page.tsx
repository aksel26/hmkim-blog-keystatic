"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { SubscribersListResponse, SubscriberStats } from "@/lib/subscribers/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPIStatCard } from "@/components/shared/KPIStatCard";
import { LoadingText } from "@/components/shared/LoadingText";

const statusOptions = [
  { value: "", label: "전체" },
  { value: "active", label: "활성" },
  { value: "unsubscribed", label: "구독 취소" },
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
    if (confirm(`구독자 ${email}을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "unsubscribed" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="구독자" description="뉴스레터 구독자를 관리합니다" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <KPIStatCard title="전체" value={stats.total} />
          <KPIStatCard title="활성" value={stats.active} tone="success" />
          <KPIStatCard title="구독 취소" value={stats.unsubscribed} className="text-muted-foreground" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          type="search"
          placeholder="이메일 또는 이름으로 검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1"
        />
        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatus(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                status === opt.value
                  ? "text-foreground font-semibold underline decoration-2 underline-offset-[6px]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.pagination.total ?? 0}명 구독자</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingText />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              구독자를 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : data?.subscribers && data.subscribers.length > 0 ? (
            <div className="divide-y divide-border/70">
              {data.subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="group py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{subscriber.email}</span>
                      <Badge variant={subscriber.status === "active" ? "success" : "secondary"}>
                        {subscriber.status === "active" ? "활성" : "구독 취소"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{subscriber.name || "-"}</span>
                      <span>구독일 {formatRelativeTime(subscriber.subscribed_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(subscriber.id, subscriber.status)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {subscriber.status === "active" ? "구독 취소" : "재활성화"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subscriber.id, subscriber.email)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    {data.pagination.page} / {data.pagination.totalPages} 페이지
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ← 이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                      }
                      disabled={page === data.pagination.totalPages}
                    >
                      다음 →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              구독자가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
