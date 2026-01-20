import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

interface DbJobPartial {
  id: string;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all jobs for analytics
    const { data: rawJobs, error } = await supabase
      .from("jobs")
      .select("id, status, category, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const jobs = (rawJobs || []) as DbJobPartial[];

    // Calculate daily stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats: Record<string, { total: number; completed: number; failed: number }> = {};

    jobs.forEach((job) => {
      const date = new Date(job.created_at).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, completed: 0, failed: 0 };
      }
      dailyStats[date].total++;
      if (job.status === "completed") dailyStats[date].completed++;
      if (job.status === "failed") dailyStats[date].failed++;
    });

    // Convert to array sorted by date
    const dailyData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Calculate category distribution
    const categoryStats: Record<string, number> = {};
    jobs?.forEach((job) => {
      categoryStats[job.category] = (categoryStats[job.category] || 0) + 1;
    });

    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate status distribution
    const statusStats: Record<string, number> = {};
    jobs?.forEach((job) => {
      statusStats[job.status] = (statusStats[job.status] || 0) + 1;
    });

    const statusData = Object.entries(statusStats).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate overall stats
    const totalJobs = jobs?.length || 0;
    const completedJobs = jobs?.filter((j) => j.status === "completed").length || 0;
    const failedJobs = jobs?.filter((j) => j.status === "failed").length || 0;
    const finishedJobs = completedJobs + failedJobs;
    const successRate = finishedJobs > 0 ? Math.round((completedJobs / finishedJobs) * 100) : 0;

    // Recent errors
    const { data: recentErrors } = await supabase
      .from("jobs")
      .select("id, topic, error, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      overview: {
        totalJobs,
        completedJobs,
        failedJobs,
        successRate,
      },
      dailyData,
      categoryData,
      statusData,
      recentErrors: recentErrors || [],
    });
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}
