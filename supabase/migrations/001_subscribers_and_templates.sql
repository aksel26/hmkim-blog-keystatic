-- =============================================
-- Subscribers & Email Templates Migration
-- Created: 2026-01-22
-- =============================================

-- subscribers 테이블
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  privacy_agreed_at TIMESTAMPTZ NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- RLS 활성화
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 작업 허용 (인증 없이 사용)
CREATE POLICY "Allow all operations on subscribers" ON subscribers
  FOR ALL USING (true) WITH CHECK (true);

-- email_templates 테이블
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 작업 허용
CREATE POLICY "Allow all operations on email_templates" ON email_templates
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 자동 갱신 함수 (이미 존재하면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- subscribers updated_at 트리거
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- email_templates updated_at 트리거
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 이메일 템플릿 삽입
INSERT INTO email_templates (name, subject, body, is_default) VALUES (
  '새 글 알림',
  '{{blog_name}}에 새 글이 발행되었습니다: {{post_title}}',
  '<!DOCTYPE html>
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
</html>',
  true
) ON CONFLICT DO NOTHING;
