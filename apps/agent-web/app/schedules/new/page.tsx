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
        throw new Error(resData.error || "Failed to create schedule.");
      }

      router.push("/schedules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Schedule</h1>
        <p className="text-muted-foreground">
          Create a new automated content schedule
        </p>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <ScheduleForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Schedule" />
    </div>
  );
}
