"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TEMPLATE_VARIABLES } from "@/lib/templates/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  is_default?: boolean;
}

interface TemplateFormProps {
  initialData?: TemplateFormData;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const DEFAULT_BODY = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 520px;">
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #0a0a0a; font-size: 18px; font-weight: 600;">{{blog_name}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0;">
              <p style="margin: 0 0 16px; color: #0a0a0a; font-size: 15px; line-height: 1.6;">
                {{subscriber_name}}님, 안녕하세요.
              </p>
              <p style="margin: 0 0 24px; color: #0a0a0a; font-size: 15px; line-height: 1.6;">
                새로운 글이 발행되었습니다.
              </p>
              <h2 style="margin: 0 0 12px; color: #0a0a0a; font-size: 20px; font-weight: 600;">{{post_title}}</h2>
              <p style="margin: 0 0 24px; color: #737373; font-size: 15px; line-height: 1.6;">{{post_summary}}</p>
              <a href="{{post_url}}" style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: 500;">
                글 읽기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.6;">
                더 이상 이메일을 받고 싶지 않으시면 <a href="{{unsubscribe_url}}" style="color: #737373;">구독을 취소</a>해 주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const DEFAULT_FORM: TemplateFormData = {
  name: "",
  subject: "",
  body: DEFAULT_BODY,
};

export default function TemplateForm({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = "저장",
}: TemplateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormData>(initialData || DEFAULT_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>템플릿 상세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  템플릿 이름 <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 새 글 알림"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  이메일 제목 <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="예: {{blog_name}}에 새 글이 발행되었습니다: {{post_title}}"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이메일 본문 (HTML)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="min-h-[400px] font-mono text-sm resize-y"
                placeholder="HTML 콘텐츠를 입력하세요..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-between w-full"
              >
                <CardTitle>미리보기</CardTitle>
                {showPreview ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <div
                  className="bg-white border border-border rounded-md p-4 text-sm max-h-80 overflow-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: form.body }}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader>
                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle>사용 가능한 변수</CardTitle>
                  {showVariables ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showVariables && (
                <CardContent className="space-y-3">
                  {TEMPLATE_VARIABLES.map((variable) => (
                    <div key={variable.key}>
                      <code className="text-xs px-1.5 py-0.5 bg-muted rounded font-mono">
                        {variable.key}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-3">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "처리 중..." : submitLabel}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  취소
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
