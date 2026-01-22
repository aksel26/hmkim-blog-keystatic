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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-tight mb-2">새 스케줄 만들기</h1>
        <p className="text-gray-500 text-sm">새로운 자동화 콘텐츠 스케줄을 생성합니다</p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 border border-red-900/50 bg-red-900/10 text-red-500 rounded text-sm text-center">
          {error}
        </div>
      )}

      <ScheduleForm onSubmit={handleSubmit} loading={loading} submitLabel="스케줄 생성" />
    </div>
  );
}
