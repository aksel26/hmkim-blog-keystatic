"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, CheckCircle, MessageSquare, RotateCcw } from "lucide-react";
import type { ReviewResult, HumanReviewAction } from "@/lib/types";

interface HumanReviewPanelProps {
  jobId: string;
  reviewResult: ReviewResult | null;
  onReviewSubmitted?: () => void;
}

export function HumanReviewPanel({
  jobId,
  reviewResult,
  onReviewSubmitted,
}: HumanReviewPanelProps) {
  const [action, setAction] = useState<HumanReviewAction | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (selectedAction: HumanReviewAction) => {
    if (selectedAction !== "approve" && !feedback.trim()) {
      setError("Please provide feedback for revision");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/human-review/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: selectedAction,
          feedback: selectedAction !== "approve" ? feedback.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-warning" />
          Human Review Required
        </CardTitle>
        <CardDescription>
          Please review the generated content and provide your feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Review Summary */}
        {reviewResult && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">AI Review Summary</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">SEO Score</span>
                <p className="text-lg font-semibold">{reviewResult.seoScore}/100</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Technical Accuracy
                </span>
                <p className="text-lg font-semibold">
                  {reviewResult.techAccuracy}/100
                </p>
              </div>
            </div>

            {reviewResult?.suggestions?.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Suggestions</span>
                <ul className="list-disc list-inside text-sm mt-1">
                  {reviewResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {reviewResult?.issues?.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground text-destructive">
                  Issues
                </span>
                <ul className="list-disc list-inside text-sm mt-1 text-destructive">
                  {reviewResult.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Feedback Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Feedback (required for revision)
          </label>
          <Textarea
            placeholder="Provide specific feedback for improving the content..."
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
            onClick={() => handleSubmit("approve")}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && action === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setAction("feedback");
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
            Request Revision
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              setAction("rewrite");
              handleSubmit("rewrite");
            }}
            disabled={isSubmitting || !feedback.trim()}
            className="flex-1"
          >
            {isSubmitting && action === "rewrite" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Rewrite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
