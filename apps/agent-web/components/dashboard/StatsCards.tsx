"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

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

  const cards = [
    {
      title: "전체 작업",
      value: stats?.totalJobs ?? "-",
      icon: FileText,
      description: "누적 전체",
    },
    {
      title: "완료",
      value: stats?.completedJobs ?? "-",
      icon: CheckCircle,
      description: "성공적으로 생성됨",
    },
    {
      title: "검토 대기",
      value: stats?.pendingReviews ?? "-",
      icon: Clock,
      description: "사용자 검토 대기 중",
    },
    {
      title: "성공률",
      value: stats?.successRate !== undefined ? `${stats.successRate}%` : "-",
      icon: AlertCircle,
      description: "완료 비율",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-16 h-8 inline-block" />
              ) : (
                card.value
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
