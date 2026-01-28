-- 조회수 집계 테이블
CREATE TABLE post_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_category TEXT NOT NULL CHECK (post_category IN ('tech', 'life')),
  post_slug TEXT NOT NULL,
  view_count BIGINT DEFAULT 0,
  unique_view_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (post_category, post_slug)
);

-- 개별 조회 로그 테이블 (분석용)
CREATE TABLE post_view_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_category TEXT NOT NULL,
  post_slug TEXT NOT NULL,
  visitor_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX post_views_lookup_idx ON post_views (post_category, post_slug);
CREATE INDEX post_view_logs_post_idx ON post_view_logs (post_category, post_slug);
CREATE INDEX post_view_logs_time_brin ON post_view_logs USING BRIN (viewed_at);
CREATE INDEX post_view_logs_visitor_idx ON post_view_logs (post_category, post_slug, visitor_id, viewed_at DESC);

-- RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_views_read" ON post_views FOR SELECT USING (true);
CREATE POLICY "post_views_all" ON post_views FOR ALL USING (true);
CREATE POLICY "post_view_logs_insert" ON post_view_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "post_view_logs_read" ON post_view_logs FOR SELECT USING (true);

-- 조회수 증가 함수 (Atomic UPSERT)
CREATE OR REPLACE FUNCTION increment_view_count(
  p_category TEXT,
  p_slug TEXT,
  p_visitor_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS TABLE(view_count BIGINT, unique_view_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_unique BOOLEAN := TRUE;
  v_view_count BIGINT;
  v_unique_view_count BIGINT;
BEGIN
  -- 유니크 방문자 확인 (24시간 내 동일 방문자)
  IF p_visitor_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM post_view_logs
      WHERE post_category = p_category
        AND post_slug = p_slug
        AND visitor_id = p_visitor_id
        AND viewed_at > NOW() - INTERVAL '24 hours'
    ) INTO is_unique;
  END IF;

  -- 조회 로그 기록
  INSERT INTO post_view_logs (post_category, post_slug, visitor_id, ip_hash, user_agent, referrer)
  VALUES (p_category, p_slug, p_visitor_id, p_ip_hash, p_user_agent, p_referrer);

  -- 조회수 UPSERT (atomic)
  INSERT INTO post_views (post_category, post_slug, view_count, unique_view_count)
  VALUES (p_category, p_slug, 1, CASE WHEN is_unique THEN 1 ELSE 0 END)
  ON CONFLICT (post_category, post_slug)
  DO UPDATE SET
    view_count = post_views.view_count + 1,
    unique_view_count = post_views.unique_view_count + (CASE WHEN is_unique THEN 1 ELSE 0 END),
    updated_at = NOW()
  RETURNING post_views.view_count, post_views.unique_view_count
  INTO v_view_count, v_unique_view_count;

  RETURN QUERY SELECT v_view_count, v_unique_view_count;
END;
$$;
