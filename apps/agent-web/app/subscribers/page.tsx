"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import type { SubscribersListResponse, SubscriberStats } from "@/lib/subscribers/types";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";

const statusOptions = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "unsubscribed", label: "Unsubscribed" },
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
    if (confirm(`Delete subscriber ${email}?`)) {
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
        <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground">
          Manage newsletter subscribers
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            Total <span className="text-foreground font-medium ml-1">{stats.total}</span>
          </span>
          <span className="text-muted-foreground">
            Active <span className="text-success font-medium ml-1">{stats.active}</span>
          </span>
          <span className="text-muted-foreground">
            Unsubscribed <span className="text-muted-foreground font-medium ml-1">{stats.unsubscribed}</span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
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
          <CardTitle>{data?.pagination.total ?? 0} Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load subscribers. Please try again.
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
                        {subscriber.status === "active" ? "Active" : "Unsubscribed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{subscriber.name || "-"}</span>
                      <span>Subscribed {formatRelativeTime(subscriber.subscribed_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(subscriber.id, subscriber.status)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {subscriber.status === "active" ? "Unsubscribe" : "Reactivate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subscriber.id, subscriber.email)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                      }
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No subscribers found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
