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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-tight mb-2">새 템플릿 만들기</h1>
        <p className="text-gray-500 text-sm">새로운 이메일 템플릿을 생성합니다</p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 border border-red-900/50 bg-red-900/10 text-red-500 rounded text-sm text-center">
          {error}
        </div>
      )}

      <TemplateForm onSubmit={handleSubmit} loading={loading} submitLabel="템플릿 생성" />
    </div>
  );
}
