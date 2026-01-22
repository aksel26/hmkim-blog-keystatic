"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Schedule, ScheduleStats } from "@/lib/scheduler/types";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, [filter]);

  async function fetchSchedules() {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("enabled", filter === "enabled" ? "true" : "false");
      }
      const res = await fetch(`/api/schedules?${params.toString()}`);
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/schedules/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    try {
      await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("정말 이 스케줄을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-end justify-between mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">스케줄 관리</h1>
          <p className="text-gray-500 text-sm">자동화된 콘텐츠 생성 작업을 관리합니다</p>
        </div>
        <Link
          href="/schedules/new"
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition"
        >
          새 스케줄 만들기
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-8 mb-12 text-sm">
          <div className="text-gray-500">
            전체 <span className="text-white font-medium ml-2">{stats.total}</span>
          </div>
          <div className="text-gray-500">
            활성 <span className="text-green-400 font-medium ml-2">{stats.enabled}</span>
          </div>
          <div className="text-gray-500">
            비활성 <span className="text-gray-400 font-medium ml-2">{stats.disabled}</span>
          </div>
          <div className="text-gray-500">
            실행 <span className="text-blue-400 font-medium ml-2">{stats.totalRuns}</span>
          </div>
          <div className="text-gray-500">
            오류 <span className="text-red-400 font-medium ml-2">{stats.totalErrors}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-6 mb-8 border-b border-gray-800 pb-1">
        {(["all", "enabled", "disabled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 text-sm transition-colors relative ${
              filter === f ? "text-white font-medium" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f === "all" ? "전체" : f === "enabled" ? "활성" : "비활성"}
            {filter === f && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-light">목록을 불러오는 중...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-20 text-gray-500 font-light">
          등록된 스케줄이 없습니다. 새로운 스케줄을 만들어보세요.
        </div>
      ) : (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
            <div className="col-span-4">이름</div>
            <div className="col-span-2">주기</div>
            <div className="col-span-2">다음 실행</div>
            <div className="col-span-2 text-center">상태</div>
            <div className="col-span-2 text-right">작업</div>
          </div>

          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="group grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-gray-800 hover:bg-gray-900/30 transition-colors"
            >
              <div className="col-span-4">
                <div className="font-medium text-gray-200">{schedule.name}</div>
                {schedule.description && (
                  <div className="text-gray-500 text-xs truncate mt-1">
                    {schedule.description}
                  </div>
                )}
                {schedule.topic_list && schedule.topic_list.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {schedule.topic_list.slice(0, 2).map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded"
                      >
                        {topic.length > 20 ? topic.slice(0, 20) + "..." : topic}
                      </span>
                    ))}
                    {schedule.topic_list.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                        +{schedule.topic_list.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <code className="text-xs text-gray-400 font-mono bg-gray-900 px-1 py-0.5 rounded border border-gray-800/50">
                  {schedule.cron_expression}
                </code>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-400">
                  {formatDate(schedule.next_run_at)}
                </div>
              </div>
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => toggleEnabled(schedule.id, !schedule.enabled)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    schedule.enabled
                      ? "bg-green-900/20 text-green-400 hover:bg-green-900/40"
                      : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                  }`}
                >
                  {schedule.enabled ? "활성" : "비활성"}
                </button>
              </div>
              <div className="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/schedules/${schedule.id}/edit`}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  편집
                </Link>
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
