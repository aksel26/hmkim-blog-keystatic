"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScheduleForm from "@/components/schedules/ScheduleForm";

export default function NewSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: any) {
    setLoading(true);
    setError(null);

    try {
      const topics =
        typeof data.topicList === "string"
          ? data.topicList
              .split("\n")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : data.topicList;

      const keywordList =
        typeof data.keywords === "string"
          ? data.keywords
              .split(",")
              .map((k: string) => k.trim())
              .filter(Boolean)
          : data.keywords;

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          topic_source: data.topicSource,
          topic_list: topics && topics.length > 0 ? topics : null,
          rss_url: data.rssUrl || null,
          ai_prompt: data.aiPrompt || null,
          category: data.category,
          template: data.template,
          target_reader: data.targetReader || null,
          keywords: keywordList && keywordList.length > 0 ? keywordList : null,
          auto_approve: data.autoApprove,
          cron_expression: data.cronExpression,
          timezone: data.timezone,
          enabled: data.enabled,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "스케줄 생성에 실패했습니다.");
      }

      router.push("/schedules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">새 스케줄</h1>
        <p className="text-muted-foreground">
          새로운 자동 콘텐츠 생성 스케줄을 만듭니다
        </p>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <ScheduleForm onSubmit={handleSubmit} loading={loading} submitLabel="스케줄 생성" />
    </div>
  );
}
