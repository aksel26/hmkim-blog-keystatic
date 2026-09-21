"use client";

import { useQuery } from "@tanstack/react-query";
import { KPIStatCard } from "@/components/shared/KPIStatCard";

interface Stats {
  totalJobs: number;
  completedJobs: number;
  pendingReviews: number;
  successRate: number;
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <KPIStatCard
        title="전체 작업"
        value={stats?.totalJobs ?? "-"}
        description="누적 전체"
        isLoading={isLoading}
      />
      <KPIStatCard
        title="완료"
        value={stats?.completedJobs ?? "-"}
        description="성공적으로 생성됨"
        tone="success"
        isLoading={isLoading}
      />
      <KPIStatCard
        title="검토 대기"
        value={stats?.pendingReviews ?? "-"}
        description="사용자 검토 대기 중"
        tone={stats?.pendingReviews ? "warning" : "default"}
        isLoading={isLoading}
      />
      <KPIStatCard
        title="성공률"
        value={stats?.successRate !== undefined ? `${stats.successRate}%` : "-"}
        description="완료 비율"
        tone="pencil"
        isLoading={isLoading}
      />
    </div>
  );
}
