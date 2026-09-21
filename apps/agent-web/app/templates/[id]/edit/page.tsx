"use client";

import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TemplateForm from "@/components/templates/TemplateForm";
import type { EmailTemplate } from "@/lib/templates/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingText } from "@/components/shared/LoadingText";

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

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchTemplate(id),
  });

  const initialData = useMemo(() => {
    if (!template) return null;

    return {
      name: template.name,
      subject: template.subject,
      body: template.body,
    };
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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingText />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="템플릿 수정" description="이메일 템플릿을 수정합니다" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive font-medium rounded-md text-sm">
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
