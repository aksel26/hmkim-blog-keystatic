"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobProgress } from "@/components/job/JobProgress";
import { ContentPreview } from "@/components/job/ContentPreview";
import { HumanReviewPanel } from "@/components/job/HumanReviewPanel";
import { DeployApprovalPanel } from "@/components/job/DeployApprovalPanel";
import { useJobStream } from "@/lib/hooks/use-job-stream";
import { formatDate } from "@/lib/utils";
import type { Job, JobStatus } from "@/lib/types";

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
      if (data.status === "completed" || data.status === "failed") {
        return false;
      }
      return 10000;
    },
    staleTime: 5000,
  });

  const shouldConnect = job &&
    job.status !== "completed" &&
    job.status !== "failed";

  const { isConnected, progress: streamProgress, currentStep: streamStep, status: streamStatus } = useJobStream(
    shouldConnect ? jobId : null,
    {
      onComplete: () => { refetch(); },
      onError: () => { refetch(); },
      onReviewRequired: () => { refetch(); },
      onPendingDeploy: () => { refetch(); },
    }
  );

  const handleDelete = async () => {
    if (!confirm("이 작업을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/jobs");
    } catch {
      alert("작업 삭제에 실패했습니다");
    }
  };

  const handleReviewSubmitted = () => {
    refetch();
  };

  const handleContentSave = useCallback(async (content: string) => {
    const res = await fetch(`/api/jobs/${jobId}/content`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalContent: content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "콘텐츠 저장에 실패했습니다");
    }
    await refetch();
  }, [jobId, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-5">
        <Link
          href="/jobs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 목록
        </Link>
        <div className="py-12 text-center">
          <p className="text-destructive">
            {error?.message || "작업을 찾을 수 없습니다"}
          </p>
          <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground mt-2 block">
            작업 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Use SSE values when connected, fallback to job data
  const displayProgress = isConnected && streamProgress > 0 ? streamProgress : job.progress;
  const displayStep = isConnected && streamStep ? streamStep : job.currentStep;

  const specialStatuses: JobStatus[] = ["human_review", "pending_deploy"];
  const getDisplayStatus = (): JobStatus => {
    if (displayStep === "human_review") return "human_review";
    if (displayStep === "pending_deploy") return "pending_deploy";
    if (streamStatus && specialStatuses.includes(streamStatus as JobStatus)) {
      return streamStatus as JobStatus;
    }
    if (specialStatuses.includes(job.status)) return job.status;
    return isConnected && streamStatus ? streamStatus : job.status;
  };
  const displayStatus = getDisplayStatus();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 목록
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-2 truncate">
            {job.topic}
          </h1>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
            <span className="capitalize">{job.category}</span>
            {job.template && <span className="capitalize">{job.template}</span>}
            <span>{formatDate(job.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 mt-7">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(displayStatus)}>
              {getStatusDisplayText(displayStatus)}
            </Badge>
            {isConnected && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground" />
                </span>
                실시간
              </span>
            )}
          </div>
          {job.prResult?.prUrl && (
            <a href={job.prResult.prUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                PR #{job.prResult.prNumber}
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground"
          >
            새로고침
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            삭제
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Progress - 좌측 (2/5) */}
        <div className="lg:col-span-2">
          <JobProgress
            progress={displayProgress}
            logs={job.progressLogs}
            isLive={isConnected}
            currentStep={displayStep}
            jobId={jobId}
            jobStatus={displayStatus}
            onActionComplete={() => refetch()}
          />
        </div>

        {/* Content Preview - 우측 (3/5) */}
        <div className="lg:col-span-3">
          <ContentPreview
            jobId={jobId}
            finalContent={job.finalContent}
            metadata={job.metadata}
            thumbnailData={job.thumbnailData}
            editable={displayStatus === "human_review" || displayStatus === "pending_deploy"}
            onContentSave={handleContentSave}
            onThumbnailRegenerated={() => refetch()}
          />
        </div>
      </div>

      {/* Human Review Panel */}
      {displayStatus === "human_review" && (
        <HumanReviewPanel
          jobId={jobId}
          reviewResult={job.reviewResult}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Deploy Approval Panel */}
      {displayStatus === "pending_deploy" && (
        <DeployApprovalPanel
          jobId={jobId}
          filepath={job.filepath}
          onDeployCompleted={handleReviewSubmitted}
        />
      )}

      {/* Error Display */}
      {displayStatus === "failed" && job.error && (
        <div className="border-t border-border pt-5">
          <p className="text-sm font-medium text-destructive mb-1">오류가 발생했습니다</p>
          <p className="text-sm text-muted-foreground">{job.error}</p>
        </div>
      )}

      {/* Completion Info */}
      {displayStatus === "completed" && (
        <div className="border-t border-border pt-5">
          <p className="text-sm font-medium mb-2">작업 완료</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {job.filepath && (
              <span>
                파일 <code className="bg-muted px-1.5 py-0.5 rounded text-xs ml-1">{job.filepath}</code>
              </span>
            )}
            {job.commitHash && (
              <span>
                커밋 <code className="bg-muted px-1.5 py-0.5 rounded text-xs ml-1">{job.commitHash.slice(0, 7)}</code>
              </span>
            )}
            {job.prResult && (
              <span>
                PR{" "}
                <a
                  href={job.prResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline font-medium ml-1"
                >
                  #{job.prResult.prNumber}
                </a>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
