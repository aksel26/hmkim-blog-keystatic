"use client";

import { useState } from "react";
import {
  CRON_PRESETS,
  TEMPLATE_OPTIONS,
  type TopicSource,
  type Category,
} from "@/lib/scheduler/types";
import { useRouter } from "next/navigation";

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

  const inputClass =
    "w-full px-0 py-2 bg-transparent border-b border-gray-800 focus:border-gray-500 transition-colors focus:outline-none placeholder-gray-600";
  const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1";
  const sectionClass = "mb-12";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Basic Info */}
      <section className={sectionClass}>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${inputClass} text-lg font-medium`}
              placeholder="스케줄 이름 입력"
            />
          </div>
          <div>
            <label className={labelClass}>설명</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="스케줄에 대한 간단한 설명"
            />
          </div>
        </div>
      </section>

      {/* Topic Settings */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-400 mb-6 border-b border-gray-800 pb-2">
          토픽 설정
        </h3>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>토픽 소스</label>
            <div className="flex gap-6 mt-2">
              {([
                { value: "manual", label: "수동 입력" },
                { value: "rss", label: "RSS 피드" },
                { value: "ai_suggest", label: "AI 추천" },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="topicSource"
                    value={option.value}
                    checked={form.topicSource === option.value}
                    onChange={(e) =>
                      setForm({ ...form, topicSource: e.target.value as TopicSource })
                    }
                    className="accent-black dark:accent-white"
                  />
                  <span
                    className={`text-sm ${
                      form.topicSource === option.value
                        ? "text-gray-200"
                        : "text-gray-500 group-hover:text-gray-400"
                    }`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.topicSource === "manual" && (
            <div>
              <label className={labelClass}>토픽 목록</label>
              <textarea
                value={form.topicList}
                onChange={(e) => setForm({ ...form, topicList: e.target.value })}
                rows={5}
                className={`${inputClass} resize-none border border-gray-800 rounded p-3`}
                placeholder="React 19&#10;Next.js 15&#10;TypeScript 5.6"
              />
            </div>
          )}

          {form.topicSource === "rss" && (
            <div>
              <label className={labelClass}>RSS URL</label>
              <input
                type="url"
                value={form.rssUrl}
                onChange={(e) => setForm({ ...form, rssUrl: e.target.value })}
                className={inputClass}
                placeholder="https://example.com/feed.xml"
              />
            </div>
          )}

          {form.topicSource === "ai_suggest" && (
            <div>
              <label className={labelClass}>AI 프롬프트</label>
              <textarea
                value={form.aiPrompt}
                onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
                rows={3}
                className={`${inputClass} resize-none border border-gray-800 rounded p-3`}
                placeholder="프론트엔드 개발 트렌드를 추천해주세요..."
              />
            </div>
          )}
        </div>
      </section>

      {/* Task Settings */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-400 mb-6 border-b border-gray-800 pb-2">
          작업 설정
        </h3>
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className={labelClass}>카테고리</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className={inputClass}
            >
              <option value="tech">Tech</option>
              <option value="life">Life</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>템플릿</label>
            <select
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              className={inputClass}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>타겟 독자</label>
            <input
              type="text"
              value={form.targetReader}
              onChange={(e) => setForm({ ...form, targetReader: e.target.value })}
              className={inputClass}
              placeholder="예: 프론트엔드 개발자"
            />
          </div>
          <div>
            <label className={labelClass}>키워드 (쉼표로 구분)</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className={inputClass}
              placeholder="React, Next.js, Performance"
            />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer py-2 group">
              <input
                type="checkbox"
                checked={form.autoApprove}
                onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 accent-black dark:accent-white"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                자동 승인 (검토 단계 건너뛰기)
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Schedule Settings */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-400 mb-6 border-b border-gray-800 pb-2">
          실행 주기 설정
        </h3>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>실행 요일</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setForm({ ...form, cronExpression: preset.value })}
                  className={`px-3 py-1.5 rounded text-xs transition-all ${
                    form.cronExpression === preset.value
                      ? "bg-gray-200 text-black font-medium"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              매주 1회 실행됩니다
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex-1">
              <label className={labelClass}>타임존</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className={inputClass}
              >
                <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 accent-black dark:accent-white"
                />
                <span className="text-sm text-gray-200 group-hover:text-white font-medium">
                  스케줄 활성화
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <div className="flex gap-4 justify-end pt-8 border-t border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "처리 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
