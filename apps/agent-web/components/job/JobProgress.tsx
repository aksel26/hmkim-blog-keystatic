"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { ProgressLog } from "@/lib/types";
import { CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";

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
}

export function JobProgress({ progress, logs, isLive = false }: JobProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "started":
      case "progress":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Progress
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

        {/* Progress Logs */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg text-sm",
                  log.status === "error" && "bg-destructive/10",
                  log.status === "completed" && "bg-success/10"
                )}
              >
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Waiting for progress updates...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
