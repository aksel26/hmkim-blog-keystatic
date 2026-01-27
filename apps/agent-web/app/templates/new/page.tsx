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
      setError(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Template</h1>
        <p className="text-muted-foreground">
          Create a new email template
        </p>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <TemplateForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Template" />
    </div>
  );
}
