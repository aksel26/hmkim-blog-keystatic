"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Popover } from "@/components/ui/Popover";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SEOChecklistContent } from "@/components/editor/SEOChecklistContent";
import { Loader2, CheckCircle, MessageSquare, RotateCcw, Pause, Info } from "lucide-react";
import type { ReviewResult, HumanReviewAction, ValidationResult } from "@/lib/types";

interface HumanReviewPanelProps {
  jobId: string;
  reviewResult: ReviewResult | null;
  validationResult?: ValidationResult | null;
  metadata?: {
    title?: string;
    summary?: string;
    keywords?: string[];
    tags?: string[];
  };
  onReviewSubmitted?: () => void;
}

export function HumanReviewPanel({
  jobId,
  reviewResult,
  validationResult,
  metadata,
  onReviewSubmitted,
}: HumanReviewPanelProps) {
  const [action, setAction] = useState<HumanReviewAction | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 확인 모달 상태
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);

  const handleSubmit = async (selectedAction: HumanReviewAction) => {
    if (selectedAction !== "approve" && selectedAction !== "hold" && !feedback.trim()) {
      setError("수정 요청 시 피드백을 작성해주세요");
      return;
    }

    setIsSubmitting(true);
    setAction(selectedAction);
    setError(null);

    try {
      // hold 액션은 별도 API 사용
      const endpoint = selectedAction === "hold"
        ? `/api/jobs/${jobId}/hold`
        : `/api/human-review/${jobId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: selectedAction,
          feedback: selectedAction !== "approve" && selectedAction !== "hold"
            ? feedback.trim()
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "검토 제출에 실패했습니다");
      }

      // 모달 닫기
      setShowApproveModal(false);
      setShowRewriteModal(false);
      setShowHoldModal(false);

      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  // SEO 점수 계산
  const calculateSEOScore = () => {
    if (reviewResult?.seoScore) return reviewResult.seoScore;

    let score = 0;
    let total = 0;

    if (metadata?.title) {
      total += 25;
      if (metadata.title.length >= 30 && metadata.title.length <= 60) score += 25;
    }
    if (metadata?.summary) {
      total += 25;
      if (metadata.summary.length >= 50 && metadata.summary.length <= 150) score += 25;
    }
    if (metadata?.keywords) {
      total += 25;
      if (metadata.keywords.length >= 3) score += 25;
    }
    if (metadata?.tags) {
      total += 25;
      if (metadata.tags.length >= 3 && metadata.tags.length <= 5) score += 25;
    }

    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const seoScore = calculateSEOScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      <Card className="border-warning">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-warning" />
                사용자 검토 필요
              </CardTitle>
              <CardDescription>
                생성된 콘텐츠를 검토하고 피드백을 제공해주세요.
              </CardDescription>
            </div>

            {/* SEO 점수 Popover */}
            <Popover
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Info className="h-4 w-4" />
                  <span className={`font-semibold ${getScoreColor(seoScore)}`}>
                    SEO {seoScore}%
                  </span>
                </Button>
              }
              align="end"
              side="bottom"
            >
              <SEOChecklistContent
                reviewResult={reviewResult ? {
                  seoScore: reviewResult.seoScore,
                  techScore: reviewResult.techAccuracy,
                  suggestions: reviewResult.suggestions,
                  issues: reviewResult.issues,
                } : undefined}
                metadata={metadata}
              />
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 검증 결과 표시 (있는 경우) */}
          {validationResult && !validationResult.passed && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="text-sm font-medium text-destructive mb-2">검증 오류</h4>
              <ul className="list-disc list-inside text-sm text-destructive/80">
                {validationResult.errors?.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI 검토 요약 (축약) */}
          {reviewResult && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">AI 검토 요약</h4>
                <div className="flex gap-4 text-sm">
                  <span>
                    SEO: <span className={`font-semibold ${getScoreColor(reviewResult.seoScore || 0)}`}>
                      {reviewResult.seoScore}점
                    </span>
                  </span>
                  <span>
                    기술: <span className={`font-semibold ${getScoreColor(reviewResult.techAccuracy || 0)}`}>
                      {reviewResult.techAccuracy}점
                    </span>
                  </span>
                </div>
              </div>

              {reviewResult?.issues?.length > 0 && (
                <p className="text-xs text-destructive">
                  {reviewResult.issues.length}개 문제점 발견
                </p>
              )}
            </div>
          )}

          {/* 직접 편집 안내 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            오탈자 등 간단한 수정은 위 미리보기에서 <strong>편집</strong> 버튼을 눌러 직접 수정할 수 있습니다.
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              피드백 (수정 요청 시 필수)
            </label>
            <Textarea
              placeholder="콘텐츠 개선을 위한 구체적인 피드백을 작성해주세요..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
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
              onClick={() => setShowApproveModal(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              승인
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!feedback.trim()) {
                  setError("수정 요청 시 피드백을 작성해주세요");
                  return;
                }
                handleSubmit("feedback");
              }}
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1"
            >
              {isSubmitting && action === "feedback" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              수정 요청
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (!feedback.trim()) {
                  setError("재작성 요청 시 피드백을 작성해주세요");
                  return;
                }
                setShowRewriteModal(true);
              }}
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              재작성
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowHoldModal(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <Pause className="mr-2 h-4 w-4" />
              보류
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 승인 확인 모달 */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => handleSubmit("approve")}
        title="콘텐츠 승인"
        description="이 콘텐츠를 승인하고 배포 단계로 진행하시겠습니까?"
        confirmText="승인"
        cancelText="취소"
        variant="default"
        isLoading={isSubmitting && action === "approve"}
      />

      {/* 재작성 확인 모달 */}
      <ConfirmModal
        isOpen={showRewriteModal}
        onClose={() => setShowRewriteModal(false)}
        onConfirm={() => handleSubmit("rewrite")}
        title="콘텐츠 재작성"
        description="피드백을 반영하여 콘텐츠를 처음부터 다시 작성합니다. Write 단계부터 다시 시작됩니다."
        confirmText="재작성"
        cancelText="취소"
        variant="destructive"
        isLoading={isSubmitting && action === "rewrite"}
      >
        <div className="p-3 bg-muted rounded-lg text-sm">
          <strong>피드백:</strong>
          <p className="mt-1 text-muted-foreground">{feedback}</p>
        </div>
      </ConfirmModal>

      {/* 보류 확인 모달 */}
      <ConfirmModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onConfirm={() => handleSubmit("hold")}
        title="검토 보류"
        description="이 작업을 보류 상태로 변경합니다. 나중에 다시 검토할 수 있습니다."
        confirmText="보류"
        cancelText="취소"
        variant="warning"
        isLoading={isSubmitting && action === "hold"}
      />
    </>
  );
}
