import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentJobs } from "@/components/dashboard/RecentJobs";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          AI Blog Post Generator Overview
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentJobs />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
