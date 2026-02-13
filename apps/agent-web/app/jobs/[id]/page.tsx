"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusBadgeVariant, getStatusDisplayText } from "@/components/ui/Badge";
import { JobProgress } from "@/components/job/JobProgress";
import { ContentPreview } from "@/components/job/ContentPreview";
import { HumanReviewPanel } from "@/components/job/HumanReviewPanel";
import { DeployApprovalPanel } from "@/components/job/DeployApprovalPanel";
import { useJobStream } from "@/lib/hooks/use-job-stream";
import { formatDate } from "@/lib/utils";
import type { Job, JobStatus } from "@/lib/types";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
  FolderOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
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
      return 10000; // Poll every 10 seconds (SSE handles real-time updates)
    },
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Connect to SSE stream for real-time updates
  // completed/failed 상태에서만 SSE 연결 해제
  const shouldConnect = job &&
    job.status !== "completed" &&
    job.status !== "failed";

  const { isConnected, progress: streamProgress, currentStep: streamStep, status: streamStatus } = useJobStream(
    shouldConnect ? jobId : null,
    {
      onComplete: () => {
        refetch();
      },
      onError: () => {
        refetch();
      },
      onReviewRequired: () => {
        refetch();
      },
      onPendingDeploy: () => {
        refetch();
      },
    }
  );

  const handleDelete = async () => {
    if (!confirm("이 작업을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      router.push("/jobs");
    } catch (err) {
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
              목록으로
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              {error?.message || "작업을 찾을 수 없습니다"}
            </p>
            <Link href="/jobs" className="text-primary hover:underline mt-2 block">
              작업 목록으로 돌아가기
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use SSE values when connected, fallback to job data
  const displayProgress = isConnected && streamProgress > 0 ? streamProgress : job.progress;
  const displayStep = isConnected && streamStep ? streamStep : job.currentStep;

  // 특수 상태(human_review, pending_deploy)는 step, streamStatus, job.status 중 하나라도 맞으면 표시
  const specialStatuses: JobStatus[] = ["human_review", "pending_deploy"];
  const getDisplayStatus = (): JobStatus => {
    // step이 특수 상태면 해당 status로 간주 (status가 아직 업데이트되지 않은 경우 대비)
    if (displayStep === "human_review") {
      return "human_review";
    }
    if (displayStep === "pending_deploy") {
      return "pending_deploy";
    }
    // streamStatus가 특수 상태면 우선
    if (streamStatus && specialStatuses.includes(streamStatus as JobStatus)) {
      return streamStatus as JobStatus;
    }
    // job.status가 특수 상태면 사용
    if (specialStatuses.includes(job.status)) {
      return job.status;
    }
    // 그 외에는 SSE 상태 또는 job 상태
    return isConnected && streamStatus ? streamStatus : job.status;
  };
  const displayStatus = getDisplayStatus();
  const isActive = displayStatus !== "completed" && displayStatus !== "failed";

  // 상태에 따른 배경색 및 아이콘
  const getStatusStyle = () => {
    switch (displayStatus) {
      case "completed":
        return { bg: "bg-green-50 dark:bg-green-950/30", icon: CheckCircle2, iconColor: "text-green-600" };
      case "failed":
        return { bg: "bg-red-50 dark:bg-red-950/30", icon: AlertCircle, iconColor: "text-red-600" };
      case "human_review":
      case "pending_deploy":
        return { bg: "bg-amber-50 dark:bg-amber-950/30", icon: Clock, iconColor: "text-amber-600" };
      default:
        return { bg: "bg-blue-50 dark:bg-blue-950/30", icon: Radio, iconColor: "text-blue-600" };
    }
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-6">
      {/* Header - 심플하게 */}
      <div className="flex items-center justify-between">
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 상태 카드 - 핵심 정보 */}
      <Card className={`${statusStyle.bg} border-0`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* 상태 아이콘 + 제목 */}
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-xl bg-background shadow-sm`}>
                <StatusIcon className={`h-6 w-6 ${statusStyle.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold truncate">{job.topic}</h1>
                  {isConnected && (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      실시간
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(job.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="capitalize">{job.category}</span>
                  </span>
                  {job.template && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="capitalize">{job.template}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 상태 + 액션 */}
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(displayStatus)} className="text-sm px-3 py-1">
                {getStatusDisplayText(displayStatus)}
              </Badge>
              {job.prResult?.prUrl && (
                <a href={job.prResult.prUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    PR #{job.prResult.prNumber}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid - 2컬럼 */}
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
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-1">오류가 발생했습니다</p>
                <p className="text-sm text-muted-foreground">{job.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Info */}
      {displayStatus === "completed" && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-green-700 dark:text-green-400">작업이 완료되었습니다</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {job.filepath && (
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">파일:</span>
                      <code className="bg-background px-2 py-0.5 rounded text-xs">{job.filepath}</code>
                    </span>
                  )}
                  {job.commitHash && (
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">커밋:</span>
                      <code className="bg-background px-2 py-0.5 rounded text-xs">{job.commitHash.slice(0, 7)}</code>
                    </span>
                  )}
                  {job.prResult && (
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">PR:</span>
                      <a
                        href={job.prResult.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        #{job.prResult.prNumber}
                      </a>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
