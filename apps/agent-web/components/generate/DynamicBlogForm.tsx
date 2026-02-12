"use client";

import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  blogFormSchema,
  type BlogFormData,
  categoryOptions,
  tonePresets,
  templateOptions,
} from "@/lib/schemas/form-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategorySelector, TechLifeFields, CommonFields } from "./fields";
import {
  FolderOpen,
  FileText,
  MessageSquare,
  Users,
  Sparkles,
  Send,
} from "lucide-react";

interface DynamicBlogFormProps {
  onSuccess?: (jobId: string) => void;
}

function RequestSummary() {
  const values = useWatch<BlogFormData>();

  const categoryLabel =
    categoryOptions.find((o) => o.value === values.category)?.label ??
    values.category;
  const toneLabel =
    tonePresets.find((o) => o.value === values.tone)?.label ?? (values.tone || undefined);
  const templateLabel =
    templateOptions.find((o) => o.value === values.template)?.label ?? undefined;

  const items: Array<{
    icon: React.ReactNode;
    label: string;
    value: string | undefined;
  }> = [
    {
      icon: <FolderOpen className="h-4 w-4" />,
      label: "카테고리",
      value: categoryLabel,
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "주제",
      value: values.topic || undefined,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "템플릿",
      value: templateLabel,
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "말투",
      value: toneLabel,
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "타겟 독자",
      value: values.targetReader || undefined,
    },
  ];

  const filledCount = items.filter((item) => item.value).length;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            요청 사항 요약
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {filledCount}/{items.length} 설정됨
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
              <div
                key={item.label}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                  item.value
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-muted/30 border border-transparent"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    item.value ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      item.value
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.value ? (
                    <p className="text-sm font-medium mt-0.5 truncate">
                      {item.value}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 mt-0.5">
                      미설정
                    </p>
                  )}
                </div>
              </div>
          ))}
        </div>

        {/* AI 프롬프트 미리보기 */}
        {values.topic && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              AI에게 전달될 내용
            </p>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground leading-relaxed space-y-1">
              <p>{values.topic}</p>
              {templateLabel && values.template !== "default" && (
                <p>글 형식: {templateLabel}</p>
              )}
              {toneLabel && <p>말투: {toneLabel}</p>}
              {values.targetReader && <p>타겟 독자: {values.targetReader}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DynamicBlogForm({ onSuccess }: DynamicBlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      category: "tech",
      topic: "",
      tone: "friendly",
      targetReader: "",
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: data.topic,
          category: data.category,
          template: data.template || "default",
          tone: data.tone,
          targetReader: data.targetReader,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "생성 요청에 실패했습니다");
      }

      const result = await response.json();

      if (onSuccess) {
        onSuccess(result.jobId);
      } else {
        router.push(`/jobs/${result.jobId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 왼쪽: 입력 폼 (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* 카테고리 선택 */}
            <CategorySelector />

            {/* Tech/Life 필드 */}
            <TechLifeFields />

            {/* 공통 설정 (말투, 타겟독자) */}
            <CommonFields />

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">생성 중...</span>
                    <span className="animate-spin">&#8987;</span>
                  </>
                ) : (
                  "블로그 포스트 생성"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => methods.reset()}
                disabled={isSubmitting}
              >
                초기화
              </Button>
            </div>
          </div>

          {/* 오른쪽: 요청 사항 요약 (2/5) */}
          <div className="lg:col-span-2">
            <RequestSummary />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
