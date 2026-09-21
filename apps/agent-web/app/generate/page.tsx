import { DynamicBlogForm } from "@/components/generate/DynamicBlogForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default function GeneratePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="블로그 포스트 생성"
        description="AI가 자동으로 블로그 포스트를 작성합니다"
      />

      <DynamicBlogForm />
    </div>
  );
}
