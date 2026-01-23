import { createServerClient } from "@/lib/supabase/client";
import type { Schedule, ScheduleInsert, ScheduleUpdate, ScheduleStats } from "./types";

export class ScheduleManager {
  private supabase = createServerClient();

  async listSchedules(options: {
    page?: number;
    limit?: number;
    enabled?: boolean;
  } = {}): Promise<{
    schedules: Schedule[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 20, enabled } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("schedules")
      .select("*", { count: "exact" });

    if (enabled !== undefined) {
      query = query.eq("enabled", enabled);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list schedules: ${error.message}`);
    }

    return {
      schedules: data as Schedule[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async getSchedule(id: string): Promise<Schedule | null> {
    const { data, error } = await this.supabase
      .from("schedules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get schedule: ${error.message}`);
    }

    return data as Schedule;
  }

  async createSchedule(input: ScheduleInsert): Promise<Schedule> {
    const nextRun = this.calculateNextRun(input.cron_expression, input.timezone || "Asia/Seoul");

    const { data, error } = await this.supabase
      .from("schedules")
      .insert({
        ...input,
        next_run_at: nextRun,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }

    return data as Schedule;
  }

  async updateSchedule(id: string, updates: ScheduleUpdate): Promise<Schedule> {
    const updateData: ScheduleUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // 크론 표현식이 변경된 경우 다음 실행 시간 재계산
    if (updates.cron_expression) {
      const schedule = await this.getSchedule(id);
      if (schedule) {
        updateData.next_run_at = this.calculateNextRun(
          updates.cron_expression,
          updates.timezone || schedule.timezone
        );
      }
    }

    const { data, error } = await this.supabase
      .from("schedules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }

    return data as Schedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("schedules")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }
  }

  async toggleEnabled(id: string, enabled: boolean): Promise<Schedule> {
    return this.updateSchedule(id, { enabled });
  }

  async getStats(): Promise<ScheduleStats> {
    const { data, error } = await this.supabase
      .from("schedules")
      .select("enabled, run_count, error_count");

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats: ScheduleStats = {
      total: data.length,
      enabled: data.filter((s) => s.enabled).length,
      disabled: data.filter((s) => !s.enabled).length,
      totalRuns: data.reduce((sum, s) => sum + (s.run_count || 0), 0),
      totalErrors: data.reduce((sum, s) => sum + (s.error_count || 0), 0),
    };

    return stats;
  }

  async getEnabledSchedules(): Promise<Schedule[]> {
    const { data, error } = await this.supabase
      .from("schedules")
      .select("*")
      .eq("enabled", true);

    if (error) {
      throw new Error(`Failed to get enabled schedules: ${error.message}`);
    }

    return data as Schedule[];
  }

  async getDueSchedules(): Promise<Schedule[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("schedules")
      .select("*")
      .eq("enabled", true)
      .lte("next_run_at", now);

    if (error) {
      throw new Error(`Failed to get due schedules: ${error.message}`);
    }

    return data as Schedule[];
  }

  async markAsRun(
    id: string,
    jobId: string,
    success: boolean,
    error?: string
  ): Promise<Schedule> {
    const schedule = await this.getSchedule(id);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    const nextRun = this.calculateNextRun(schedule.cron_expression, schedule.timezone);
    const topicIndex = success
      ? (schedule.topic_index + 1) % (schedule.topic_list?.length || 1)
      : schedule.topic_index;

    const updates: ScheduleUpdate = {
      last_run_at: new Date().toISOString(),
      next_run_at: nextRun,
      last_job_id: jobId,
      topic_index: topicIndex,
      run_count: schedule.run_count + 1,
      error_count: success ? schedule.error_count : schedule.error_count + 1,
      last_error: success ? null : error,
    };

    return this.updateSchedule(id, updates);
  }

  async getNextTopic(schedule: Schedule): Promise<string | null> {
    if (schedule.topic_source === "manual" && schedule.topic_list?.length) {
      return schedule.topic_list[schedule.topic_index % schedule.topic_list.length];
    }

    // RSS 및 AI 생성은 추후 구현
    return null;
  }

  private calculateNextRun(cronExpression: string, timezone: string): string {
    // 간단한 크론 파싱 (실제 배포 시 cron-parser 라이브러리 사용 권장)
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const now = new Date();

    // 현재 시간 기준으로 다음 실행 시간 계산 (간소화된 버전)
    let next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);

    if (minute !== "*") {
      next.setMinutes(parseInt(minute, 10));
    }

    if (hour !== "*") {
      next.setHours(parseInt(hour, 10));
    }

    // 이미 지난 시간이면 다음 날로
    if (next <= now) {
      if (dayOfWeek !== "*") {
        // 특정 요일인 경우 다음 해당 요일로
        const targetDay = parseInt(dayOfWeek, 10);
        const currentDay = next.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntil);
      } else if (dayOfMonth !== "*") {
        // 특정 일자인 경우 다음 달로
        const targetDate = parseInt(dayOfMonth, 10);
        if (next.getDate() >= targetDate) {
          next.setMonth(next.getMonth() + 1);
        }
        next.setDate(targetDate);
      } else {
        // 매일인 경우
        next.setDate(next.getDate() + 1);
      }
    }

    return next.toISOString();
  }
}

export const scheduleManager = new ScheduleManager();
