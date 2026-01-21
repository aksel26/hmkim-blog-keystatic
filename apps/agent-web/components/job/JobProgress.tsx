"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Search,
  PenTool,
  Eye,
  Sparkles,
  FileCheck,
  User,
  GitPullRequest,
  ThumbsUp,
  XCircle,
} from "lucide-react";

// 워크플로우 단계 정의 (새로운 순서)
// Research → Write → Review → Create → Validate → Human Review → Deploy
const workflowSteps = [
  { id: "research", label: "리서치", icon: Search },
  { id: "write", label: "초안 작성", icon: PenTool },
  { id: "review", label: "AI 검토", icon: Eye },
  { id: "create", label: "콘텐츠 개선", icon: Sparkles },
  { id: "validate", label: "검증", icon: FileCheck },
  { id: "human_review", label: "사용자 검토", icon: User },
  { id: "deploy", label: "PR 생성", icon: GitPullRequest },
];

// step 이름 매핑
const stepMapping: Record<string, string> = {
  research: "research",
  write: "write",
  writing: "write",
  review: "review",
  create: "create",
  creating: "create",
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

  // 사용자 검토 승인
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

  // 배포 승인
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

  // 배포 거부
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
  // 현재 진행 중인 단계 찾기
  const getCurrentStepIndex = () => {
    const normalizedCurrent = currentStep ? (stepMapping[currentStep] || currentStep) : null;
    if (!normalizedCurrent) return -1;
    return workflowSteps.findIndex((s) => s.id === normalizedCurrent);
  };

  const currentIndex = getCurrentStepIndex();

  // 단계별 로그 메시지들 가져오기
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

  const getStepIcon = (stepId: string, status: string) => {
    const step = workflowSteps.find((s) => s.id === stepId);
    const Icon = step?.icon || Circle;

    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />;
      case "current":
        return <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />;
      default:
        return <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            진행 상황
            {isLive && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </CardTitle>
          <span className="text-2xl font-bold">{progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <Progress value={progress} className="h-3" />

        {/* Step Checklist */}
        <div className="space-y-1">
          {workflowSteps.map((step, index) => {
            // 현재 인덱스 기준으로 상태 결정
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

            // 로그에서 에러 확인
            const errorCheckLogs = logs.filter((log) => {
              const normalizedStep = stepMapping[log.step] || log.step;
              return normalizedStep === step.id;
            });
            if (errorCheckLogs.some((log) => log.status === "error")) {
              status = "error";
            }

            // 단계별 로그 메시지들
            const stepLogItems = getStepLogs(step.id);

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg transition-colors",
                  status === "completed" && "bg-success/10",
                  status === "current" && "bg-primary/10",
                  status === "error" && "bg-destructive/10"
                )}
              >
                {getStepIcon(step.id, status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        status === "completed" && "text-success",
                        status === "current" && "text-primary",
                        status === "error" && "text-destructive",
                        status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    {status === "current" && (
                      <span className="text-xs text-primary">진행 중...</span>
                    )}
                    {status === "completed" && (
                      <span className="text-xs text-success">완료</span>
                    )}
                  </div>
                  {/* 단계별 로그 표시 */}
                  {(status === "completed" || status === "current") && stepLogItems.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {stepLogItems.map((log, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground truncate">
                          • {log.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 사용자 검토 버튼 */}
                {step.id === "human_review" && jobStatus === "human_review" && (
                  <Button
                    size="sm"
                    onClick={handleHumanReviewApprove}
                    disabled={isSubmitting}
                    className="shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        승인
                      </>
                    )}
                  </Button>
                )}

                {/* 배포 승인 버튼 */}
                {step.id === "deploy" && jobStatus === "pending_deploy" && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={handleDeployApprove}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          PR 생성
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeployReject}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}
