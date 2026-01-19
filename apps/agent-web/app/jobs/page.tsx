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
  { value: "", label: "All Statuses" },
  { value: "queued", label: "Queued" },
  { value: "research", label: "Researching" },
  { value: "writing", label: "Writing" },
  { value: "human_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
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
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          View and manage all blog generation jobs
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by topic..."
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
            {data?.pagination.total ?? 0} Jobs
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
              Failed to load jobs. Please try again.
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
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1)
                        )
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
              <p>No jobs found.</p>
              <Link href="/generate" className="text-primary hover:underline">
                Create your first post
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
