import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentJobs } from "@/components/dashboard/RecentJobs";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PageHeader } from "@/components/shared/PageHeader";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="대시보드" description="AI 블로그 포스트 생성기 현황" />

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
