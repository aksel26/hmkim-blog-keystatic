"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  PenTool,
  Eye,
  User,
  Sparkles,
  FileCheck,
  Rocket,
  CheckCircle,
} from "lucide-react";
import type { JobStatus } from "@/lib/types";

const steps = [
  { id: "research", label: "Research", icon: Search },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "review", label: "AI Review", icon: Eye },
  { id: "human_review", label: "Human Review", icon: User },
  { id: "creating", label: "Creating", icon: Sparkles },
  { id: "validating", label: "Validating", icon: FileCheck },
  { id: "deploying", label: "Deploying", icon: Rocket },
  { id: "completed", label: "Completed", icon: CheckCircle },
];

interface StepIndicatorProps {
  currentStep: string | null;
  status: JobStatus;
}

export function StepIndicator({ currentStep, status }: StepIndicatorProps) {
  const getCurrentStepIndex = () => {
    if (status === "failed") return -1;
    if (status === "queued") return -1;
    return steps.findIndex((s) => s.id === currentStep || s.id === status);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFailed = status === "failed" && isCurrent;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1"
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted && "bg-success border-success text-success-foreground",
                  isCurrent && !isFailed && "bg-primary border-primary text-primary-foreground",
                  isFailed && "bg-destructive border-destructive text-destructive-foreground",
                  !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground"
                )}
              >
                <step.icon className="w-5 h-5" />
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCompleted && "text-success",
                  isCurrent && !isFailed && "text-primary",
                  isFailed && "text-destructive",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 -z-10",
                    isCompleted ? "bg-success" : "bg-border"
                  )}
                  style={{
                    width: "calc(100% - 2.5rem)",
                    left: "calc(50% + 1.25rem)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
