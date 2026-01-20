"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/Badge";
import { StepIndicator } from "@/components/job/StepIndicator";
import { JobProgress } from "@/components/job/JobProgress";
import { ContentPreview } from "@/components/job/ContentPreview";
import { HumanReviewPanel } from "@/components/job/HumanReviewPanel";
import { useJobStream } from "@/lib/hooks/use-job-stream";
import { formatDate } from "@/lib/utils";
import type { Job, JobStatus, ProgressLog } from "@/lib/types";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface JobWithLogs extends Job {
  progressLogs: Array<{
    id: number;
    step: string;
    status: string;
    message: string;
    data: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

async function fetchJob(id: string): Promise<JobWithLogs> {
  const res = await fetch(`/api/jobs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;

  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      // Stop polling if job is completed or failed
      if (data.status === "completed" || data.status === "failed") {
        return false;
      }
      return 3000; // Poll every 3 seconds for active jobs
    },
  });

  // Connect to SSE stream for real-time updates
  const { isConnected, progress: streamProgress } = useJobStream(
    job && job.status !== "completed" && job.status !== "failed" ? jobId : null,
    {
      onProgress: () => {
        refetch();
      },
      onComplete: () => {
        refetch();
      },
      onError: () => {
        refetch();
      },
      onReviewRequired: () => {
        refetch();
      },
    }
  );

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      router.push("/jobs");
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  const handleReviewSubmitted = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              {error?.message || "Job not found"}
            </p>
            <Link href="/jobs" className="text-primary hover:underline mt-2 block">
              Return to jobs list
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = job.status !== "completed" && job.status !== "failed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{job.topic}</h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(job.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(job.status)} className="text-sm">
            {getStatusDisplayText(job.status)}
          </Badge>

          {isConnected && (
            <Badge variant="outline" className="text-xs">
              <span className="mr-1 h-2 w-2 rounded-full bg-success inline-block animate-pulse" />
              Live
            </Badge>
          )}

          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {job.prResult?.prUrl && (
            <a
              href={job.prResult.prUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                View PR
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Category</span>
              <p className="font-medium capitalize">{job.category}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Template</span>
              <p className="font-medium capitalize">
                {job.template || "Default"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Progress</span>
              <p className="font-medium">{job.progress}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Current Step</span>
              <p className="font-medium capitalize">
                {job.currentStep || "Queued"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Indicator */}
      {isActive && (
        <Card>
          <CardContent className="pt-6">
            <StepIndicator currentStep={job.currentStep} status={job.status} />
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress */}
        <JobProgress
          progress={streamProgress || job.progress}
          logs={job.progressLogs}
          isLive={isConnected}
        />

        {/* Content Preview */}
        <ContentPreview
          draftContent={job.draftContent}
          finalContent={job.finalContent}
          metadata={job.metadata}
        />
      </div>

      {/* Human Review Panel */}
      {job.status === "human_review" && (
        <HumanReviewPanel
          jobId={jobId}
          reviewResult={job.reviewResult}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Error Display */}
      {job.status === "failed" && job.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Completion Info */}
      {job.status === "completed" && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="text-success">Completed Successfully</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.filepath && (
              <p className="text-sm">
                <span className="text-muted-foreground">File:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded">{job.filepath}</code>
              </p>
            )}
            {job.commitHash && (
              <p className="text-sm">
                <span className="text-muted-foreground">Commit:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {job.commitHash.slice(0, 7)}
                </code>
              </p>
            )}
            {job.prResult && (
              <p className="text-sm">
                <span className="text-muted-foreground">PR:</span>{" "}
                <a
                  href={job.prResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  #{job.prResult.prNumber}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
