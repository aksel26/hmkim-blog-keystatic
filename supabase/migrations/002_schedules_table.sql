-- schedules 테이블 (자동 포스팅 스케줄러)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- 토픽 설정
  topic_source TEXT DEFAULT 'manual' CHECK (topic_source IN ('manual', 'rss', 'ai_suggest')),
  topic_list TEXT[],
  topic_index INTEGER DEFAULT 0,
  rss_url TEXT,
  ai_prompt TEXT,

  -- 작업 설정 (tone 제거됨)
  category TEXT DEFAULT 'tech' CHECK (category IN ('tech', 'life')),
  template TEXT DEFAULT 'default',
  target_reader TEXT,
  keywords TEXT[],
  auto_approve BOOLEAN DEFAULT false,

  -- 스케줄 설정
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',
  enabled BOOLEAN DEFAULT true,

  -- 실행 기록
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_job_id UUID,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run_at);

-- RLS 활성화
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (anon 키로 접근 허용)
CREATE POLICY "Allow all operations for schedules" ON schedules
  FOR ALL USING (true) WITH CHECK (true);
