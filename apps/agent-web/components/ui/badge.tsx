import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import type { JobStatus } from "@/lib/types"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "bg-success/10 text-success [a&]:hover:bg-success/20",
        warning:
          "bg-warning/10 text-warning [a&]:hover:bg-warning/20",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// Helper function to get badge variant from job status
function getStatusBadgeVariant(
  status: JobStatus
): VariantProps<typeof badgeVariants>["variant"] {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "destructive";
    case "queued":
      return "secondary";
    case "human_review":
    case "pending_deploy":
    case "on_hold":
      return "warning";
    case "running":
    case "research":
    case "writing":
    case "review":
    case "creating":
    case "thumbnail":
    case "validating":
    case "deploying":
      return "default";
    default:
      return "default";
  }
}

// Helper function to get status display text
function getStatusDisplayText(status: JobStatus): string {
  const statusMap: Record<JobStatus, string> = {
    queued: "대기중",
    running: "실행중",
    research: "리서치 중",
    writing: "작성 중",
    review: "AI 검토 중",
    creating: "콘텐츠 개선 중",
    thumbnail: "썸네일 생성 중",
    validating: "검증 중",
    human_review: "사용자 검토 대기",
    on_hold: "보류 중",
    pending_deploy: "PR 승인 대기",
    deploying: "PR 생성 중",
    completed: "완료",
    failed: "실패",
  };
  return statusMap[status] || status;
}

export { Badge, badgeVariants, getStatusBadgeVariant, getStatusDisplayText }
