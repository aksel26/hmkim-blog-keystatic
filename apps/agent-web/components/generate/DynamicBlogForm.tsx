"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { blogFormSchema, type BlogFormData } from "@/lib/schemas/form-schemas";
import { Button } from "@/components/ui/Button";
import { CategorySelector, TechLifeFields } from "./fields";

interface DynamicBlogFormProps {
  onSuccess?: (jobId: string) => void;
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
      keywords: "",
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
          keywords: data.keywords?.split(",").map((k) => k.trim()),
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 카테고리 선택 */}
        <CategorySelector />

        {/* Tech/Life 필드 */}
        <TechLifeFields />

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
      </form>
    </FormProvider>
  );
}
