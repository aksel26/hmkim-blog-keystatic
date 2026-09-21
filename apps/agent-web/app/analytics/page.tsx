"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPIStatCard } from "@/components/shared/KPIStatCard";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
  };
  dailyData: Array<{
    date: string;
    total: number;
    completed: number;
    failed: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
  }>;
  statusData: Array<{
    name: string;
    value: number;
  }>;
  recentErrors: Array<{
    id: string;
    topic: string;
    error: string;
    created_at: string;
  }>;
}

// 차트 색은 globals.css의 --chart-* 토큰을 따른다 (라이트/다크 자동 대응)
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "none",
  borderRadius: "6px",
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)",
  fontSize: 12,
};

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="분석" description="분석 데이터를 불러오는 중…" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {["전체 작업", "완료", "실패", "성공률"].map((title) => (
            <KPIStatCard key={title} title={title} value="-" isLoading />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="분석" />
        <p className="font-medium text-destructive">분석 데이터를 불러오는데 실패했습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="분석" description="성과 지표와 트렌드를 확인합니다" />

      {/* Overview */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KPIStatCard title="전체 작업" value={data.overview.totalJobs} description="누적 전체" />
        <KPIStatCard title="완료" value={data.overview.completedJobs} description="성공적으로 생성됨" tone="success" />
        <KPIStatCard
          title="실패"
          value={data.overview.failedJobs}
          description="생성 실패"
          tone={data.overview.failedJobs > 0 ? "destructive" : "default"}
        />
        <KPIStatCard title="성공률" value={`${data.overview.successRate}%`} description="완료 비율" tone="pencil" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Generation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>일별 생성 현황</CardTitle>
            <CardDescription>일별 작업 생성 수 (최근 30일)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyData}>
                    <CartesianGrid vertical={false} strokeDasharray="2 4" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)} // Show MM-DD
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--success)"
                      strokeWidth={2}
                      name="완료"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      name="실패"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  데이터 없음
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리 분포</CardTitle>
            <CardDescription>카테고리별 작업 수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="var(--chart-1)"
                      stroke="var(--card)"
                      dataKey="value"
                    >
                      {data.categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  데이터 없음
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Recent Errors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>상태 분포</CardTitle>
            <CardDescription>현재 상태별 작업 수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.statusData} layout="vertical">
                    <CartesianGrid horizontal={false} strokeDasharray="2 4" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="value" fill="var(--pencil)" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  데이터 없음
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle>최근 오류</CardTitle>
            <CardDescription>최근 실패한 작업</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentErrors.length > 0 ? (
              <div className="space-y-2">
                {data.recentErrors.map((error) => (
                  <Link
                    key={error.id}
                    href={`/jobs/${error.id}`}
                    className="block p-3 rounded-md bg-destructive/8 hover:bg-destructive/15 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-sm">
                        {truncate(error.topic, 40)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(error.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-destructive truncate">
                      {error.error}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                오류 없음
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
