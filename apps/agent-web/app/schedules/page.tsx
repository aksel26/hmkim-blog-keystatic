"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Schedule, ScheduleStats } from "@/lib/scheduler/types";
import { Plus, Loader2 } from "lucide-react";

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
    if (!confirm("이 스케줄을 삭제하시겠습니까?")) return;
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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">스케줄</h1>
          <p className="text-muted-foreground">
            자동 콘텐츠 생성 관리
          </p>
        </div>
        <Link href="/schedules/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 스케줄
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            전체 <span className="text-foreground font-medium ml-1">{stats.total}</span>
          </span>
          <span className="text-muted-foreground">
            활성 <span className="text-success font-medium ml-1">{stats.enabled}</span>
          </span>
          <span className="text-muted-foreground">
            비활성 <span className="text-muted-foreground font-medium ml-1">{stats.disabled}</span>
          </span>
          <span className="text-muted-foreground">
            실행 <span className="text-foreground font-medium ml-1">{stats.totalRuns}</span>
          </span>
          <span className="text-muted-foreground">
            오류 <span className="text-destructive font-medium ml-1">{stats.totalErrors}</span>
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-border">
        {(["all", "enabled", "disabled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-2 text-sm transition-colors relative ${
              filter === f ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "전체" : f === "enabled" ? "활성" : "비활성"}
            {filter === f && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{schedules.length}개 스케줄</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">스케줄이 없습니다.</p>
              <Link href="/schedules/new" className="text-foreground hover:underline">
                첫 번째 스케줄 만들기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="group py-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{schedule.name}</span>
                      <Badge variant={schedule.enabled ? "success" : "secondary"}>
                        {schedule.enabled ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {schedule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <code className="font-mono bg-muted px-1 py-0.5 rounded">
                        {schedule.cron_expression}
                      </code>
                      <span>다음 실행: {formatDate(schedule.next_run_at)}</span>
                    </div>
                    {schedule.topic_list && schedule.topic_list.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {schedule.topic_list.slice(0, 2).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic.length > 20 ? topic.slice(0, 20) + "..." : topic}
                          </Badge>
                        ))}
                        {schedule.topic_list.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{schedule.topic_list.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEnabled(schedule.id, !schedule.enabled)}
                    >
                      {schedule.enabled ? "비활성화" : "활성화"}
                    </Button>
                    <Link href={`/schedules/${schedule.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
