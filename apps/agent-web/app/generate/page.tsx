import { DynamicBlogForm } from "@/components/generate/DynamicBlogForm";

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          블로그 포스트 생성
        </h1>
        <p className="text-muted-foreground">
          AI가 자동으로 블로그 포스트를 작성합니다
        </p>
      </div>

      <DynamicBlogForm />
    </div>
  );
}
