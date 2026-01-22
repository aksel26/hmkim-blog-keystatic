"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import type { SubscribersListResponse, SubscriberStats } from "@/lib/subscribers/types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Mail,
} from "lucide-react";

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
    if (confirm(`정말 ${email} 구독자를 삭제하시겠습니까?`)) {
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.unsubscribed ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="sm:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{data?.pagination.total ?? 0} Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load subscribers. Please try again.
            </div>
          ) : data?.subscribers && data.subscribers.length > 0 ? (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-4">Email</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Subscribed</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {data.subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="md:col-span-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground hidden md:block" />
                    <span className="font-medium truncate">{subscriber.email}</span>
                  </div>
                  <div className="md:col-span-2 text-muted-foreground">
                    {subscriber.name || "-"}
                  </div>
                  <div className="md:col-span-2">
                    <Badge
                      variant={subscriber.status === "active" ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(subscriber.id, subscriber.status)}
                    >
                      {subscriber.status === "active" ? "Active" : "Unsubscribed"}
                    </Badge>
                  </div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    {formatRelativeTime(subscriber.subscribed_at)}
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subscriber.id, subscriber.email)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
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
            <div className="text-center py-8 text-muted-foreground">
              No subscribers found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
