"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import type { TemplatesListResponse } from "@/lib/templates/types";
import {
  Plus,
  Loader2,
  FileText,
  Star,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

async function fetchTemplates(): Promise<TemplatesListResponse> {
  const res = await fetch("/api/templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete template");
  }
}

async function setDefaultTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_default: true }),
  });
  if (!res.ok) throw new Error("Failed to set default template");
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const handleDelete = (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      alert("기본 템플릿은 삭제할 수 없습니다.");
      return;
    }
    if (confirm(`정말 "${name}" 템플릿을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  const previewTemplate = data?.templates.find((t) => t.id === previewId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage newsletter email templates
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>{data?.total ?? 0} Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load templates. Please try again.
            </div>
          ) : data?.templates && data.templates.length > 0 ? (
            <div className="space-y-4">
              {data.templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {formatRelativeTime(template.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link href={`/templates/${template.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {!template.is_default && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMutation.mutate(template.id)}
                            disabled={setDefaultMutation.isPending}
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(template.id, template.name, template.is_default)
                            }
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {previewId === template.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium mb-2">Preview</h4>
                      <div
                        className="bg-background border rounded-lg p-4 text-sm max-h-96 overflow-auto"
                        dangerouslySetInnerHTML={{ __html: template.body }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No templates found.</p>
              <Link href="/templates/new" className="text-primary hover:underline">
                Create your first template
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
