"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const inputClass =
    "w-full px-0 py-2 bg-transparent border-b border-gray-800 focus:border-gray-500 transition-colors focus:outline-none placeholder-gray-600";
  const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1";
  const sectionClass = "mb-12";

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-0">
          {/* Basic Info */}
          <section className={sectionClass}>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  템플릿 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`${inputClass} text-lg font-medium`}
                  placeholder="예: 새 글 알림"
                />
              </div>
              <div>
                <label className={labelClass}>
                  이메일 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputClass}
                  placeholder="예: {{blog_name}}에 새 글이 발행되었습니다: {{post_title}}"
                />
              </div>
            </div>
          </section>

          {/* Body Editor */}
          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-400 mb-6 border-b border-gray-800 pb-2">
              이메일 본문 (HTML)
            </h3>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full min-h-[400px] p-4 bg-gray-900 border border-gray-800 rounded font-mono text-sm resize-y focus:outline-none focus:border-gray-600 placeholder-gray-600"
              placeholder="HTML 내용을 입력하세요..."
            />
          </section>

          {/* Preview */}
          <section>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-6 border-b border-gray-800 pb-2 w-full hover:text-gray-300 transition-colors"
            >
              미리보기
              {showPreview ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showPreview && (
              <div
                className="bg-white border border-gray-800 rounded-lg p-6 text-sm max-h-96 overflow-auto prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: form.body }}
              />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            {/* Variables */}
            <section className="mb-8">
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-400 mb-4 pb-2 border-b border-gray-800 hover:text-gray-300 transition-colors"
              >
                사용 가능한 변수
                {showVariables ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showVariables && (
                <div className="space-y-4">
                  {TEMPLATE_VARIABLES.map((variable) => (
                    <div key={variable.key}>
                      <code className="text-xs px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-blue-400">
                        {variable.key}
                      </code>
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "처리 중..." : submitLabel}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full mt-3 px-6 py-2 text-sm text-gray-500 hover:text-gray-300 transition text-center"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
