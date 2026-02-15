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
import { FileText, CheckCircle, XCircle, TrendingUp } from "lucide-react";
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

const COLORS = ["#0984e3", "#00b894", "#fdcb6e", "#e17055", "#6c5ce7", "#74b9ff"];

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">분석</h1>
          <p className="text-muted-foreground">분석 데이터를 불러오는 중...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse bg-muted rounded h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">분석</h1>
          <p className="text-destructive">분석 데이터를 불러오는데 실패했습니다</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "전체 작업",
      value: data.overview.totalJobs,
      icon: FileText,
      description: "누적 전체",
    },
    {
      title: "완료",
      value: data.overview.completedJobs,
      icon: CheckCircle,
      description: "성공적으로 생성됨",
    },
    {
      title: "실패",
      value: data.overview.failedJobs,
      icon: XCircle,
      description: "생성 실패",
    },
    {
      title: "성공률",
      value: `${data.overview.successRate}%`,
      icon: TrendingUp,
      description: "완료 비율",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">분석</h1>
        <p className="text-muted-foreground">
          성과 지표와 트렌드를 확인합니다
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)} // Show MM-DD
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="완료"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
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
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
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
      <div className="grid gap-6 md:grid-cols-2">
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#0984e3" radius={[0, 4, 4, 0]} />
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
              <div className="space-y-4">
                {data.recentErrors.map((error) => (
                  <Link
                    key={error.id}
                    href={`/jobs/${error.id}`}
                    className="block p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {truncate(error.topic, 40)}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
