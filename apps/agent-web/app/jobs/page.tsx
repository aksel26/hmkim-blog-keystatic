"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { JobStatus, JobsListResponse } from "@/lib/types";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const statusOptions = [
  { value: "", label: "전체 상태" },
  { value: "queued", label: "대기중" },
  { value: "research", label: "리서치 중" },
  { value: "writing", label: "작성 중" },
  { value: "human_review", label: "검토 대기" },
  { value: "completed", label: "완료" },
  { value: "failed", label: "실패" },
];

async function fetchJobs(params: {
  page: number;
  status?: string;
  search?: string;
}): Promise<JobsListResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "10",
  });

  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`/api/jobs?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", page, status, search],
    queryFn: () => fetchJobs({ page, status, search }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">작업 목록</h1>
        <p className="text-muted-foreground">
          블로그 생성 작업을 조회하고 관리합니다
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주제로 검색..."
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
              className="sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {data?.pagination.total ?? 0}개 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-muted rounded-lg h-20"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              작업 목록을 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : data?.jobs && data.jobs.length > 0 ? (
            <div className="space-y-4">
              {data.jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {truncate(job.topic, 60)}
                    </span>
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {getStatusDisplayText(job.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="capitalize">{job.category}</span>
                      {job.template && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {job.template}
                        </span>
                      )}
                    </div>
                    <span>{formatRelativeTime(job.createdAt)}</span>
                  </div>
                  {job.status !== "completed" && job.status !== "failed" && (
                    <Progress value={job.progress} className="mt-3" />
                  )}
                </Link>
              ))}

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
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
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1)
                        )
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
            <div className="text-center py-8 text-muted-foreground">
              <p>작업이 없습니다.</p>
              <Link href="/generate" className="text-primary hover:underline">
                첫 번째 포스트 생성하기
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsLoading />}>
      <JobsContent />
    </Suspense>
  );
}
