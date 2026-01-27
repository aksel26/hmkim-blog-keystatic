import type { Schedule, ScheduleInsert, ScheduleUpdate } from "@/lib/supabase/schema";

export type { Schedule, ScheduleInsert, ScheduleUpdate };

export type TopicSource = "manual" | "rss" | "ai_suggest";
export type Category = "tech" | "life";

export interface ScheduleFormData {
  name: string;
  description?: string;
  topicSource: TopicSource;
  topicList?: string[];
  rssUrl?: string;
  aiPrompt?: string;
  category: Category;
  template: string;
  targetReader?: string;
  keywords?: string[];
  autoApprove: boolean;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
}

export interface ScheduleStats {
  total: number;
  enabled: number;
  disabled: number;
  totalRuns: number;
  totalErrors: number;
}

export const CRON_PRESETS = [
  { label: "매주 일요일 오전 9시", value: "0 9 * * 0" },
  { label: "매주 월요일 오전 9시", value: "0 9 * * 1" },
  { label: "매주 수요일 오전 9시", value: "0 9 * * 3" },
  { label: "매주 금요일 오전 9시", value: "0 9 * * 5" },
] as const;

export const TEMPLATE_OPTIONS = [
  { label: "기본", value: "default" },
  { label: "튜토리얼", value: "tutorial" },
  { label: "비교 분석", value: "comparison" },
  { label: "딥 다이브", value: "deep-dive" },
  { label: "팁", value: "tips" },
] as const;
