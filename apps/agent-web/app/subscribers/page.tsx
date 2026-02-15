"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { SubscribersListResponse, SubscriberStats } from "@/lib/subscribers/types";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">구독자</h1>
        <p className="text-muted-foreground">
          뉴스레터 구독자를 관리합니다
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            전체 <span className="text-foreground font-medium ml-1">{stats.total}</span>
          </span>
          <span className="text-muted-foreground">
            활성 <span className="text-success font-medium ml-1">{stats.active}</span>
          </span>
          <span className="text-muted-foreground">
            구독 취소 <span className="text-muted-foreground font-medium ml-1">{stats.unsubscribed}</span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이메일 또는 이름으로 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-4 border-b border-border sm:border-0">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatus(opt.value);
                setPage(1);
              }}
              className={`pb-2 sm:pb-0 text-sm transition-colors relative ${
                status === opt.value
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
              {status === opt.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground sm:hidden" />
              )}
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              구독자를 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : data?.subscribers && data.subscribers.length > 0 ? (
            <div className="divide-y divide-border">
              {data.subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="group py-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{subscriber.email}</span>
                      <Badge variant={subscriber.status === "active" ? "success" : "secondary"}>
                        {subscriber.status === "active" ? "활성" : "구독 취소"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
                    {data.pagination.page} / {data.pagination.totalPages} 페이지
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                      }
                      disabled={page === data.pagination.totalPages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              구독자가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
