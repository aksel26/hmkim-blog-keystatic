"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 워크플로우 단계 정의
const workflowSteps = [
  { id: "research", label: "리서치" },
  { id: "write", label: "초안 작성" },
  { id: "review", label: "AI 검토" },
  { id: "create", label: "콘텐츠 개선" },
  { id: "thumbnail", label: "썸네일" },
  { id: "validate", label: "검증" },
  { id: "human_review", label: "사용자 검토" },
  { id: "deploy", label: "PR 생성" },
];

// step 이름 매핑
const stepMapping: Record<string, string> = {
  research: "research",
  write: "write",
  writing: "write",
  review: "review",
  create: "create",
  creating: "create",
  thumbnail: "thumbnail",
  validate: "validate",
  validating: "validate",
  human_review: "human_review",
  on_hold: "human_review",
  deploy: "deploy",
  deploying: "deploy",
  pending_deploy: "deploy",
  init: "research",
  workflow: "research",
  complete: "deploy",
  completed: "deploy",
  error: "error",
};

interface JobProgressProps {
  progress: number;
  logs: Array<{
    id: number;
    step: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
  isLive?: boolean;
  currentStep?: string | null;
  jobId?: string;
  jobStatus?: string;
  onActionComplete?: () => void;
}

export function JobProgress({
  progress,
  logs,
  isLive = false,
  currentStep,
  jobId,
  jobStatus,
  onActionComplete,
}: JobProgressProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHumanReviewApprove = async () => {
    if (!jobId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/human-review/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) onActionComplete?.();
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeployApprove = async () => {
    if (!jobId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/deploy/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) onActionComplete?.();
    } catch (err) {
      console.error("Failed to deploy:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeployReject = async () => {
    if (!jobId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/deploy/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) onActionComplete?.();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentStepIndex = () => {
    const normalizedCurrent = currentStep ? (stepMapping[currentStep] || currentStep) : null;
    if (!normalizedCurrent) return -1;
    return workflowSteps.findIndex((s) => s.id === normalizedCurrent);
  };

  const currentIndex = getCurrentStepIndex();

  const getStepLogs = (stepId: string): Array<{ message: string; status: string }> => {
    const stepLogs = logs.filter((log) => {
      const normalizedStep = stepMapping[log.step] || log.step;
      return normalizedStep === stepId;
    });
    return stepLogs.slice(-3).map((log) => ({
      message: log.message,
      status: log.status,
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm font-medium">
          진행 상황
          {isLive && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">실시간</span>
          )}
        </p>
        <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-1.5 mb-5" />

      {/* Step Timeline */}
      <div className="flex-1">
        {workflowSteps.map((step, index) => {
          let status: "pending" | "current" | "completed" | "error" = "pending";

          if (progress === 100) {
            status = "completed";
          } else if (currentIndex >= 0) {
            if (index < currentIndex) {
              status = "completed";
            } else if (index === currentIndex) {
              status = "current";
            }
          }

          const errorCheckLogs = logs.filter((log) => {
            const normalizedStep = stepMapping[log.step] || log.step;
            return normalizedStep === step.id;
          });
          if (errorCheckLogs.some((log) => log.status === "error")) {
            status = "error";
          }

          const stepLogItems = getStepLogs(step.id);
          const isLast = index === workflowSteps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline: dot + line */}
              <div className="flex flex-col items-center w-4 shrink-0">
                {/* Dot */}
                {status === "current" ? (
                  <span className="relative flex h-2 w-2 mt-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
                  </span>
                ) : status === "error" ? (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
                ) : status === "completed" ? (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-foreground shrink-0" />
                ) : (
                  <span className="mt-1.5 h-2 w-2 rounded-full border border-border shrink-0" />
                )}
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1 min-h-4",
                      (status === "completed" || status === "current")
                        ? "bg-foreground/20"
                        : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 min-w-0 pb-4", isLast && "pb-0")}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      status === "completed" && "text-foreground",
                      status === "current" && "text-foreground font-medium",
                      status === "error" && "text-destructive font-medium",
                      status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {status === "current" && (
                    <span className="text-xs text-muted-foreground">진행 중</span>
                  )}

                  {/* Action buttons inline */}
                  {step.id === "human_review" && jobStatus === "human_review" && (
                    <Button
                      size="sm"
                      onClick={handleHumanReviewApprove}
                      disabled={isSubmitting}
                      className="shrink-0 ml-auto h-7 text-xs"
                    >
                      {isSubmitting ? "처리 중..." : "승인"}
                    </Button>
                  )}

                  {step.id === "deploy" && jobStatus === "pending_deploy" && (
                    <div className="flex gap-1 shrink-0 ml-auto">
                      <Button
                        size="sm"
                        onClick={handleDeployApprove}
                        disabled={isSubmitting}
                        className="h-7 text-xs"
                      >
                        {isSubmitting ? "처리 중..." : "PR 생성"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeployReject}
                        disabled={isSubmitting}
                        className="text-muted-foreground h-7 text-xs"
                      >
                        반려
                      </Button>
                    </div>
                  )}
                </div>

                {/* Step logs */}
                {(status === "completed" || status === "current") && stepLogItems.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {stepLogItems.map((log, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground truncate">
                        {log.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
