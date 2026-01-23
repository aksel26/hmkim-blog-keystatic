"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { type Schedule } from "@/lib/scheduler/types";
import ScheduleForm from "@/components/schedules/ScheduleForm";

export default function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  async function fetchSchedule() {
    try {
      const res = await fetch(`/api/schedules/${id}`);
      if (!res.ok) throw new Error("스케줄을 찾을 수 없습니다.");
      const schedule: Schedule = await res.json();

      setInitialData({
        name: schedule.name,
        description: schedule.description || "",
        topicSource: schedule.topic_source,
        topicList: schedule.topic_list?.join("\n") || "",
        rssUrl: schedule.rss_url || "",
        aiPrompt: schedule.ai_prompt || "",
        category: schedule.category,
        template: schedule.template,
        targetReader: schedule.target_reader || "",
        keywords: schedule.keywords?.join(", ") || "",
        autoApprove: schedule.auto_approve,
        cronExpression: schedule.cron_expression,
        timezone: schedule.timezone,
        enabled: schedule.enabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "스케줄을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: any) {
    setSaving(true);
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

      const res = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
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
        throw new Error(resData.error || "스케줄 수정에 실패했습니다.");
      }

      router.push("/schedules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center py-12 text-gray-500 text-sm font-light">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-tight mb-2">스케줄 수정</h1>
        <p className="text-gray-500 text-sm">자동화 콘텐츠 스케줄을 수정합니다</p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 border border-red-900/50 bg-red-900/10 text-red-500 rounded text-sm text-center">
          {error}
        </div>
      )}

      {initialData && (
        <ScheduleForm
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel="변경사항 저장"
        />
      )}
    </div>
  );
}
