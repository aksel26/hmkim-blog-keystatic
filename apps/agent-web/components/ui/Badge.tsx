import * as React from "react";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variant === "default" &&
            "bg-primary text-primary-foreground",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground",
          variant === "success" &&
            "bg-success text-success-foreground",
          variant === "warning" &&
            "bg-warning text-warning-foreground",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground",
          variant === "outline" &&
            "border border-border text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// Helper function to get badge variant from job status
export function getStatusBadgeVariant(
  status: JobStatus
): BadgeProps["variant"] {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "destructive";
    case "queued":
      return "secondary";
    case "human_review":
    case "pending_deploy":
      return "warning";
    case "running":
    case "research":
    case "writing":
    case "review":
    case "creating":
    case "createFile":
    case "validating":
    case "deploying":
      return "default";
    default:
      return "default";
  }
}

// Helper function to get status display text
export function getStatusDisplayText(status: JobStatus): string {
  const statusMap: Record<JobStatus, string> = {
    queued: "대기중",
    running: "실행중",
    research: "리서치 중",
    writing: "작성 중",
    review: "AI 검토 중",
    human_review: "사용자 검토 대기",
    creating: "콘텐츠 개선 중",
    createFile: "파일 생성 중",
    validating: "검증 중",
    pending_deploy: "PR 승인 대기",
    deploying: "PR 생성 중",
    completed: "완료",
    failed: "실패",
  };
  return statusMap[status] || status;
}

export { Badge };
