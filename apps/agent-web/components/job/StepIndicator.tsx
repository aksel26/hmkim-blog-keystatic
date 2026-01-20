"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  PenTool,
  Eye,
  User,
  Sparkles,
  FileText,
  FileCheck,
  GitPullRequest,
  CheckCircle,
} from "lucide-react";
import type { JobStatus } from "@/lib/types";

// 워크플로우 단계 정의 (agent 앱의 실제 step 이름과 일치)
const steps = [
  { id: "research", label: "리서치", icon: Search },
  { id: "write", label: "초안 작성", icon: PenTool },
  { id: "review", label: "AI 검토", icon: Eye },
  { id: "human_review", label: "사용자 검토", icon: User },
  { id: "create", label: "콘텐츠 개선", icon: Sparkles },
  { id: "createFile", label: "파일 생성", icon: FileText },
  { id: "validate", label: "검증", icon: FileCheck },
  { id: "deploy", label: "PR 생성", icon: GitPullRequest },
];

// step 이름 매핑 (다양한 이름을 통일)
const stepMapping: Record<string, string> = {
  // 워크플로우 단계
  research: "research",
  write: "write",
  writing: "write",
  review: "review",
  human_review: "human_review",
  create: "create",
  creating: "create",
  createFile: "createFile",
  validate: "validate",
  validating: "validate",
  deploy: "deploy",
  deploying: "deploy",
  pending_deploy: "deploy",
  // 초기/완료 상태
  init: "research",
  queued: "research",
  running: "research",
  workflow: "research",
  complete: "deploy",
  completed: "deploy",
};

interface StepIndicatorProps {
  currentStep: string | null;
  status: JobStatus;
}

export function StepIndicator({ currentStep, status }: StepIndicatorProps) {
  const getNormalizedStep = () => {
    if (status === "failed") return null;
    if (status === "completed") return "deploy"; // 완료시 마지막 단계

    const step = currentStep || status;
    return stepMapping[step] || step;
  };

  const normalizedStep = getNormalizedStep();
  const currentIndex = normalizedStep
    ? steps.findIndex((s) => s.id === normalizedStep)
    : -1;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => {
          const isCompleted = status === "completed" || index < currentIndex;
          const isCurrent = index === currentIndex && status !== "completed";
          const isFailed = status === "failed" && index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-success border-success text-white",
                    isCurrent && !isFailed && "bg-primary border-primary text-white animate-pulse",
                    isFailed && "bg-destructive border-destructive text-white",
                    isPending && !isFailed && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isCompleted && "text-success",
                    isCurrent && !isFailed && "text-primary font-bold",
                    isFailed && "text-destructive",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    isCompleted ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
