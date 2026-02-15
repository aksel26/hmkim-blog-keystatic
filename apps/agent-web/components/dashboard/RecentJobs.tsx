"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Job, JobStatus } from "@/lib/types";
import { ArrowRight } from "lucide-react";

async function fetchRecentJobs(): Promise<Job[]> {
  const res = await fetch("/api/jobs?limit=5");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const data = await res.json();
  return data.jobs;
}

export function RecentJobs() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["recentJobs"],
    queryFn: fetchRecentJobs,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>최근 작업</CardTitle>
        <Link
          href="/jobs"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          전체 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-muted rounded-lg h-16"
              />
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {truncate(job.topic, 40)}
                  </span>
                  <Badge variant={getStatusBadgeVariant(job.status as JobStatus)}>
                    {getStatusDisplayText(job.status as JobStatus)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="capitalize">{job.category}</span>
                  <span>{formatRelativeTime(job.createdAt)}</span>
                </div>
                {job.status !== "completed" && job.status !== "failed" && (
                  <Progress value={job.progress} className="mt-2" />
                )}
              </Link>
            ))}
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
  );
}
