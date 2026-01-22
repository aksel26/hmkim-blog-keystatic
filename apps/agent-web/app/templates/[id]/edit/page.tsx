"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TEMPLATE_VARIABLES, EmailTemplate } from "@/lib/templates/types";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchTemplate(id),
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [template]);

  const mutation = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      router.push("/templates");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    mutation.mutate({ name, subject, body });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Template</h1>
          <p className="text-muted-foreground">{template?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., New Post Notification"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., {{blog_name}}에 새 글이 발행되었습니다: {{post_title}}"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Body (HTML)</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full min-h-[400px] p-3 rounded-md border border-input bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter HTML content..."
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Hide" : "Show"} Preview
                  </Button>
                </div>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <div
                    className="bg-white border rounded-lg p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Available Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TEMPLATE_VARIABLES.map((variable) => (
                    <div key={variable.key} className="text-sm">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {variable.key}
                      </code>
                      <p className="text-muted-foreground mt-1">
                        {variable.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Link href="/templates" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
