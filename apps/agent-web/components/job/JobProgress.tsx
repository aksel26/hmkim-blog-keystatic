"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 워크플로우 단계 정의
const workflowSteps = [
  { id: "research", label: "리서치" },
  { id: "write", label: "초안 작성" },
  { id: "review", label: "AI 검토" },
  { id: "create", label: "콘텐츠 개선" },
  { id: "fact_check", label: "정확도 검증" },
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
  fact_check: "fact_check",
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
  // 로그를 보려고 직접 고른 단계. 고르지 않았으면 진행을 따라간다
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

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

  type StepStatus = "pending" | "current" | "completed" | "error";

  // 같은 문구가 연달아 기록된 로그(route와 executor가 각각 남긴 것)는 하나로 접는다
  const getStepLogs = (stepId: string) =>
    logs
      .filter((log) => (stepMapping[log.step] || log.step) === stepId)
      .filter((log, i, arr) => i === 0 || log.message !== arr[i - 1].message);

  const steps = workflowSteps.map((step, index) => {
    const stepLogs = getStepLogs(step.id);
    let status: StepStatus = "pending";
    if (progress === 100) status = "completed";
    else if (currentIndex >= 0) status = index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending";
    if (stepLogs.some((log) => log.status === "error")) status = "error";
    return { ...step, index, status, logs: stepLogs };
  });

  // 아래 한 줄에 보여 줄 단계. 노드를 고르기 전에는 오류가 난 단계, 없으면 현재 단계, 다 끝났으면 마지막 단계를 따라간다
  const followed =
    steps.find((s) => s.status === "error") ??
    steps.find((s) => s.status === "current") ??
    [...steps].reverse().find((s) => s.status === "completed");
  const shown = steps.find((s) => s.id === selectedStep && s.status !== "pending") ?? followed;

  return (
    <section aria-label="진행 상황">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-lg font-bold tracking-tight">
          진행 상황
          {isLive && (
            <span className="ml-2 text-xs font-medium text-pencil">실시간</span>
          )}
        </p>
        <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
      </div>

      {/* 가로 노드. 번호가 든 원을 선으로 잇는다: 완료=먹색으로 채움, 진행 중=먹색 링, 오류=빨간 링, 대기=가는 링.
          좁은 화면에서는 가로로 스크롤한다 */}
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-[40rem]">
          {steps.map((step) => {
            const isLast = step.index === steps.length - 1;
            const selectable = step.status !== "pending";
            return (
              <li key={step.id} className="relative flex flex-1 flex-col items-center">
                {/* 다음 노드까지의 선. 이 단계가 끝났으면 먹색으로 찬다 */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-3 left-1/2 h-px w-full transition-[background-color] duration-300 ease-out",
                      step.status === "completed" ? "bg-foreground" : "bg-border"
                    )}
                  />
                )}
                <button
                  type="button"
                  disabled={!selectable}
                  aria-current={step.status === "current" ? "step" : undefined}
                  aria-pressed={shown?.id === step.id}
                  aria-label={`${step.index + 1}단계 ${step.label}`}
                  onClick={() => setSelectedStep(step.id)}
                  className={cn(
                    // after: 보이는 크기(24px)는 두고 클릭 영역만 40px로 넓힌다
                    "relative z-10 flex size-6 items-center justify-center rounded-full bg-background text-xs tabular-nums outline-none",
                    "transition-[background-color,color,box-shadow,scale] duration-150 ease-out after:absolute after:top-1/2 after:left-1/2 after:size-[40px] after:-translate-1/2",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50 enabled:active:scale-[0.96] disabled:cursor-default",
                    step.status === "completed" && "bg-primary text-primary-foreground font-semibold",
                    step.status === "current" && "font-bold text-foreground shadow-[0_0_0_1.5px_var(--foreground)] animate-pulse",
                    step.status === "error" && "font-bold text-destructive shadow-[0_0_0_1.5px_var(--destructive)]",
                    step.status === "pending" && "text-muted-foreground/60 shadow-[0_0_0_1px_var(--input)]",
                    // 고른 노드는 바깥에 링을 하나 더 둘러 표시한다
                    shown?.id === step.id && step.status === "completed" && "shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--foreground)]"
                  )}
                >
                  {step.index + 1}
                </button>
                <span
                  className={cn(
                    "mt-2 px-1 text-center text-xs",
                    step.status === "completed" && "text-foreground",
                    step.status === "current" && "font-semibold text-foreground",
                    step.status === "error" && "font-semibold text-destructive",
                    step.status === "pending" && "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 고른(또는 진행 중인) 단계의 최근 로그와, 사람의 결정이 필요한 때의 버튼 */}
      <div className="mt-4 flex min-h-7 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {shown && (
            <>
              <p className="text-sm font-semibold">
                <span className="mr-2 tabular-nums text-muted-foreground">{String(shown.index + 1).padStart(2, "0")}</span>
                {shown.label}
                {shown.status === "current" && <span className="ml-2 text-xs font-medium text-pencil">진행 중</span>}
              </p>
              {shown.logs.slice(-3).map((log, idx) => (
                <p key={idx} className={cn("mt-0.5 truncate text-xs text-muted-foreground", log.status === "error" && "text-destructive")}>
                  {/* 에이전트 로그에 섞인 이모지는 화면에서 걸러낸다 */}
                  {log.message.replace(/\p{Extended_Pictographic}\uFE0F?\s*/gu, "")}
                </p>
              ))}
            </>
          )}
        </div>

        {jobStatus === "human_review" && (
          <Button size="sm" onClick={handleHumanReviewApprove} disabled={isSubmitting} className="shrink-0 h-7 text-xs">
            {isSubmitting ? "처리 중..." : "승인"}
          </Button>
        )}
        {jobStatus === "pending_deploy" && (
          <div className="flex shrink-0 gap-1">
            <Button size="sm" onClick={handleDeployApprove} disabled={isSubmitting} className="h-7 text-xs">
              {isSubmitting ? "처리 중..." : "PR 생성"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDeployReject} disabled={isSubmitting} className="text-muted-foreground h-7 text-xs">
              반려
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
