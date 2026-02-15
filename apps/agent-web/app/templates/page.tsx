"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { TemplatesListResponse } from "@/lib/templates/types";
import { ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">이메일 템플릿</h1>
          <p className="text-muted-foreground">
            뉴스레터 이메일 템플릿을 관리합니다
          </p>
        </div>
        <Link href="/templates/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 템플릿
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.total ?? 0}개 템플릿</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              템플릿을 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : data?.templates && data.templates.length > 0 ? (
            <div className="divide-y divide-border">
              {data.templates.map((template) => (
                <div key={template.id}>
                  <div className="group py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="secondary">기본</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        수정일 {formatRelativeTime(template.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                      >
                        미리보기
                        {expandedId === template.id ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Link href={`/templates/${template.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                      </Link>
                      {!template.is_default && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMutation.mutate(template.id)}
                            disabled={setDefaultMutation.isPending}
                          >
                            기본으로 설정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id, template.name, template.is_default)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedId === template.id && (
                    <div className="pb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">미리보기</p>
                      <div
                        className="border border-border rounded-md p-4 text-sm max-h-64 overflow-auto prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.body }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">템플릿이 없습니다.</p>
              <Link href="/templates/new" className="text-foreground hover:underline">
                첫 번째 템플릿 만들기
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
