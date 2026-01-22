"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TEMPLATE_VARIABLES } from "@/lib/templates/types";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

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
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [showPreview, setShowPreview] = useState(false);

  const mutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
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
          <h1 className="text-2xl font-semibold tracking-tight">New Template</h1>
          <p className="text-muted-foreground">Create a new email template</p>
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
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Template"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

const DEFAULT_BODY = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #111; margin: 0 0 10px 0; }
    .summary { color: #666; font-size: 16px; }
    .button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>안녕하세요, {{subscriber_name}}님!</p>
      <p>{{blog_name}}에 새로운 글이 발행되었습니다.</p>
    </div>
    <h1 class="title">{{post_title}}</h1>
    <p class="summary">{{post_summary}}</p>
    <a href="{{post_url}}" class="button">글 읽기</a>
    <div class="footer">
      <p>더 이상 이메일을 받고 싶지 않으시다면 <a href="{{unsubscribe_url}}">구독 해지</a>를 클릭해주세요.</p>
    </div>
  </div>
</body>
</html>`;
