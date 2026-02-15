"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
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
  cronExpression: "0 9 * * 0",
  timezone: "Asia/Seoul",
  enabled: true,
};

const categoryOptions = [
  { value: "tech", label: "기술" },
  { value: "life", label: "라이프" },
];

const timezoneOptions = [
  { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
  { value: "UTC", label: "UTC" },
];

export default function ScheduleForm({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = "저장",
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
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              이름 <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="스케줄 이름"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">설명</label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="스케줄에 대한 간단한 설명"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>주제 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">주제 소스</label>
            <div className="flex gap-4">
              {([
                { value: "manual", label: "직접 입력" },
                { value: "rss", label: "RSS 피드" },
                { value: "ai_suggest", label: "AI 추천" },
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
              <label className="block text-sm font-medium mb-1.5">주제 목록</label>
              <Textarea
                value={form.topicList}
                onChange={(e) => setForm({ ...form, topicList: e.target.value })}
                rows={4}
                placeholder="React 19&#10;Next.js 15&#10;TypeScript 5.6"
              />
              <p className="text-xs text-muted-foreground mt-1">한 줄에 하나의 주제를 입력하세요</p>
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
              <label className="block text-sm font-medium mb-1.5">AI 프롬프트</label>
              <Textarea
                value={form.aiPrompt}
                onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
                rows={3}
                placeholder="프론트엔드 개발 트렌드 추천..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Settings */}
      <Card>
        <CardHeader>
          <CardTitle>작업 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">카테고리</label>
              <NativeSelect
                options={categoryOptions}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">템플릿</label>
              <NativeSelect
                options={TEMPLATE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">대상 독자</label>
            <Input
              type="text"
              value={form.targetReader}
              onChange={(e) => setForm({ ...form, targetReader: e.target.value })}
              placeholder="예: 프론트엔드 개발자"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">키워드 (쉼표로 구분)</label>
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
              자동 승인 (검토 단계 건너뛰기)
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle>스케줄 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">실행 요일</label>
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
            <p className="text-xs text-muted-foreground mt-2">
              주 1회 실행
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1.5">시간대</label>
              <NativeSelect
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
                스케줄 활성화
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
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
