import type { EmailTemplate } from "@/lib/supabase/schema";

export type { EmailTemplate };

export interface TemplatesListResponse {
  templates: EmailTemplate[];
  total: number;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  body: string;
  is_default?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  body?: string;
  is_default?: boolean;
}

// Template variables that can be used in templates
export const TEMPLATE_VARIABLES = [
  { key: "{{blog_name}}", description: "블로그 이름" },
  { key: "{{post_title}}", description: "글 제목" },
  { key: "{{post_summary}}", description: "글 요약" },
  { key: "{{post_url}}", description: "글 URL" },
  { key: "{{subscriber_name}}", description: "구독자 이름" },
  { key: "{{unsubscribe_url}}", description: "구독 해지 URL" },
] as const;
