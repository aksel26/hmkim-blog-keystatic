"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { JobsListResponse } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingText } from "@/components/shared/LoadingText";

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
    <div className="space-y-4">
      <PageHeader title="작업 목록" description="블로그 생성 작업을 조회하고 관리합니다" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="search"
          placeholder="주제로 검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1"
        />
        <NativeSelect
          options={statusOptions}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="sm:w-48"
        />
      </div>

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
            <div className="text-center py-6 text-destructive">
              작업 목록을 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : data?.jobs && data.jobs.length > 0 ? (
            <div className="-mx-2 divide-y divide-border/70">
              {data.jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-md px-2 py-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-base font-semibold">
                      {truncate(job.topic, 60)}
                    </span>
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {getStatusDisplayText(job.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3 uppercase tracking-wide">
                      <span>{job.category}</span>
                      {job.template && <span className="text-muted-foreground/70">{job.template}</span>}
                    </div>
                    <span>{formatRelativeTime(job.createdAt)}</span>
                  </div>
                  {job.status !== "completed" && job.status !== "failed" && (
                    <Progress value={job.progress} className="mt-2 h-1" />
                  )}
                </Link>
              ))}

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 pt-4">
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
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1)
                        )
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
            <div className="text-center py-6 text-muted-foreground">
              <p>작업이 없습니다.</p>
              <Link href="/generate" className="font-medium text-pencil hover:underline">
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
      <LoadingText />
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
