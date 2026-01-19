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
      return "warning";
    default:
      return "default";
  }
}

// Helper function to get status display text
export function getStatusDisplayText(status: JobStatus): string {
  const statusMap: Record<JobStatus, string> = {
    queued: "Queued",
    research: "Researching",
    writing: "Writing",
    review: "AI Review",
    human_review: "Pending Review",
    creating: "Creating",
    validating: "Validating",
    deploying: "Deploying",
    completed: "Completed",
    failed: "Failed",
  };
  return statusMap[status] || status;
}

export { Badge };
