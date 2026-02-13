"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateForm from "@/components/templates/TemplateForm";

interface CreateTemplateRequest {
  name: string;
  subject: string;
  body: string;
  is_default?: boolean;
}

async function createTemplate(data: CreateTemplateRequest) {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create template");
  return res.json();
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: CreateTemplateRequest) {
    setLoading(true);
    setError(null);

    try {
      await createTemplate(data);
      router.push("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "템플릿 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">새 템플릿</h1>
        <p className="text-muted-foreground">
          새로운 이메일 템플릿을 만듭니다
        </p>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <TemplateForm onSubmit={handleSubmit} loading={loading} submitLabel="템플릿 생성" />
    </div>
  );
}
