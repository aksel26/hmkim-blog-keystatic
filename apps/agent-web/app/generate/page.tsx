import { TopicForm } from "@/components/generate/TopicForm";

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate</h1>
        <p className="text-muted-foreground">
          Create a new AI-generated blog post
        </p>
      </div>

      <TopicForm />
    </div>
  );
}
