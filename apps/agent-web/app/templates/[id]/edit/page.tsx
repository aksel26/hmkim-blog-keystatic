"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TemplateForm from "@/components/templates/TemplateForm";
import type { EmailTemplate } from "@/lib/templates/types";

async function fetchTemplate(id: string): Promise<EmailTemplate> {
  const res = await fetch(`/api/templates/${id}`);
  if (!res.ok) throw new Error("Failed to fetch template");
  return res.json();
}

async function updateTemplate(id: string, data: Partial<EmailTemplate>) {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<{
    name: string;
    subject: string;
    body: string;
  } | null>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchTemplate(id),
  });

  useEffect(() => {
    if (template) {
      setInitialData({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    }
  }, [template]);

  const mutation = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      router.push("/templates");
    },
    onError: (err: Error) => {
      setError(err.message || "템플릿 수정에 실패했습니다.");
    },
  });

  async function handleSubmit(data: { name: string; subject: string; body: string }) {
    setError(null);
    mutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center py-20 text-gray-500 font-light">
          템플릿을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-tight mb-2">템플릿 수정</h1>
        <p className="text-gray-500 text-sm">이메일 템플릿을 수정합니다</p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 border border-red-900/50 bg-red-900/10 text-red-500 rounded text-sm text-center">
          {error}
        </div>
      )}

      {initialData && (
        <TemplateForm
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={mutation.isPending}
          submitLabel="변경사항 저장"
        />
      )}
    </div>
  );
}
