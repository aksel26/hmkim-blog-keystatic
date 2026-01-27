"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import {
  CRON_PRESETS,
  TEMPLATE_OPTIONS,
  type TopicSource,
  type Category,
} from "@/lib/scheduler/types";

interface ScheduleFormData {
  name: string;
  description: string;
  topicSource: TopicSource;
  topicList: string;
  rssUrl: string;
  aiPrompt: string;
  category: Category;
  template: string;
  targetReader: string;
  keywords: string;
  autoApprove: boolean;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
}

interface ScheduleFormProps {
  initialData?: ScheduleFormData;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const DEFAULT_FORM: ScheduleFormData = {
  name: "",
  description: "",
  topicSource: "manual",
  topicList: "",
  rssUrl: "",
  aiPrompt: "",
  category: "tech",
  template: "default",
  targetReader: "",
  keywords: "",
  autoApprove: false,
  cronExpression: "0 9 * * 1",
  timezone: "Asia/Seoul",
  enabled: true,
};

const categoryOptions = [
  { value: "tech", label: "Tech" },
  { value: "life", label: "Life" },
];

const timezoneOptions = [
  { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
];

export default function ScheduleForm({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = "Save",
}: ScheduleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ScheduleFormData>(initialData || DEFAULT_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Schedule name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the schedule"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic Source</label>
            <div className="flex gap-4">
              {([
                { value: "manual", label: "Manual" },
                { value: "rss", label: "RSS Feed" },
                { value: "ai_suggest", label: "AI Suggest" },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="topicSource"
                    value={option.value}
                    checked={form.topicSource === option.value}
                    onChange={(e) =>
                      setForm({ ...form, topicSource: e.target.value as TopicSource })
                    }
                    className="accent-foreground"
                  />
                  <span className={`text-sm ${
                    form.topicSource === option.value
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.topicSource === "manual" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Topic List</label>
              <Textarea
                value={form.topicList}
                onChange={(e) => setForm({ ...form, topicList: e.target.value })}
                rows={4}
                placeholder="React 19&#10;Next.js 15&#10;TypeScript 5.6"
              />
              <p className="text-xs text-muted-foreground mt-1">One topic per line</p>
            </div>
          )}

          {form.topicSource === "rss" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">RSS URL</label>
              <Input
                type="url"
                value={form.rssUrl}
                onChange={(e) => setForm({ ...form, rssUrl: e.target.value })}
                placeholder="https://example.com/feed.xml"
              />
            </div>
          )}

          {form.topicSource === "ai_suggest" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">AI Prompt</label>
              <Textarea
                value={form.aiPrompt}
                onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
                rows={3}
                placeholder="Suggest frontend development trends..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Task Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <Select
                options={categoryOptions}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Template</label>
              <Select
                options={[...TEMPLATE_OPTIONS]}
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Target Reader</label>
            <Input
              type="text"
              value={form.targetReader}
              onChange={(e) => setForm({ ...form, targetReader: e.target.value })}
              placeholder="e.g., Frontend developers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Keywords (comma separated)</label>
            <Input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="React, Next.js, Performance"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoApprove}
              onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })}
              className="w-4 h-4 rounded accent-foreground"
            />
            <span className="text-sm text-muted-foreground">
              Auto-approve (skip review step)
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setForm({ ...form, cronExpression: preset.value })}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    form.cronExpression === preset.value
                      ? "bg-foreground text-background font-medium"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Cron Expression <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.cronExpression}
              onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
              placeholder="0 9 * * 1"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: minute hour day month weekday
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1.5">Timezone</label>
              <Select
                options={timezoneOptions}
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer h-9">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-foreground"
              />
              <span className="text-sm font-medium">
                Enable schedule
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
