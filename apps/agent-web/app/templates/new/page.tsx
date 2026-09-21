"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateForm from "@/components/templates/TemplateForm";
import { PageHeader } from "@/components/shared/PageHeader";

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
    <div className="space-y-4">
      <PageHeader title="새 템플릿" description="새로운 이메일 템플릿을 만듭니다" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive font-medium rounded-md text-sm">
          {error}
        </div>
      )}

      <TemplateForm onSubmit={handleSubmit} loading={loading} submitLabel="템플릿 생성" />
    </div>
  );
}
