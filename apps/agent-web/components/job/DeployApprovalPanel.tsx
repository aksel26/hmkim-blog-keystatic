"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GitPullRequest, CheckCircle, XCircle, FileText } from "lucide-react";

interface DeployApprovalPanelProps {
  jobId: string;
  filepath: string | null;
  onDeployCompleted?: () => void;
}

export function DeployApprovalPanel({
  jobId,
  filepath,
  onDeployCompleted,
}: DeployApprovalPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (selectedAction: "approve" | "reject") => {
    setIsSubmitting(true);
    setAction(selectedAction);
    setError(null);

    try {
      const response = await fetch(`/api/deploy/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: selectedAction }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "처리에 실패했습니다");
      }

      onDeployCompleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      setIsSubmitting(false);
      setAction(null);
    }
  };

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-warning" />
          PR 생성 승인
        </CardTitle>
        <CardDescription>
          콘텐츠 검증이 완료되었습니다. PR을 생성하시겠습니까?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        {filepath && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">생성된 파일:</span>
            </div>
            <code className="text-sm mt-1 block">{filepath}</code>
          </div>
        )}

        {/* Info Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>승인</strong>: 새 브랜치를 생성하고 PR을 요청합니다.</p>
          <p>• <strong>반려</strong>: PR 생성을 건너뛰고 완료합니다. 파일은 로컬에 유지됩니다.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleAction("approve")}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && action === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            승인 - PR 생성
          </Button>

          <Button
            variant="outline"
            onClick={() => handleAction("reject")}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && action === "reject" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            반려 - PR 생성 안함
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
