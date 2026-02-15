"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Loader2 } from "lucide-react";
import type { Category, Template } from "@/lib/types";

const categoryOptions = [
  { value: "tech", label: "기술" },
  { value: "life", label: "라이프" },
];

const templateOptions = [
  { value: "default", label: "기본 (템플릿 없음)" },
  { value: "tutorial", label: "튜토리얼" },
  { value: "comparison", label: "비교 분석" },
  { value: "deep-dive", label: "심층 분석" },
  { value: "tips", label: "팁 & 트릭" },
];

export function TopicForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<Category>("tech");
  const [template, setTemplate] = useState<Template>("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("주제를 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          template: template === "default" ? undefined : template,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "작업 생성에 실패했습니다");
      }

      const data = await response.json();
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>블로그 포스트 생성</CardTitle>
        <CardDescription>
          주제를 입력하면 AI가 블로그 포스트를 작성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">
              주제 *
            </label>
            <Textarea
              id="topic"
              placeholder="예: Node.js와 Express로 REST API 만들기"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              블로그 포스트에서 다룰 내용을 구체적으로 작성해주세요.
            </p>
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              카테고리
            </label>
            <NativeSelect
              id="category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={isSubmitting}
            />
          </div>

          {/* Template Select */}
          <div className="space-y-2">
            <label htmlFor="template" className="text-sm font-medium">
              템플릿
            </label>
            <NativeSelect
              id="template"
              options={templateOptions}
              value={template}
              onChange={(e) => setTemplate(e.target.value as Template)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              블로그 포스트의 구조를 안내할 템플릿을 선택하세요.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !topic.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                작업 생성 중...
              </>
            ) : (
              "포스트 생성"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
