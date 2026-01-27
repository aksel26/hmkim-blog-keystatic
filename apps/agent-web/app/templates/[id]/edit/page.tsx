"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TemplateForm from "@/components/templates/TemplateForm";
import type { EmailTemplate } from "@/lib/templates/types";
import { Loader2 } from "lucide-react";

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
      setError(err.message || "Failed to update template.");
    },
  });

  async function handleSubmit(data: { name: string; subject: string; body: string }) {
    setError(null);
    mutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Template</h1>
        <p className="text-muted-foreground">
          Modify email template
        </p>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {initialData && (
        <TemplateForm
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={mutation.isPending}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
