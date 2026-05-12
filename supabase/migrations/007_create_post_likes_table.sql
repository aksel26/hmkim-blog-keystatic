-- 게시글 좋아요 집계 테이블
CREATE TABLE post_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_category TEXT NOT NULL CHECK (post_category IN ('tech', 'life')),
  post_slug TEXT NOT NULL,
  like_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (post_category, post_slug)
);

-- 방문자별 좋아요 기록 테이블 (중복 방지/토글용)
CREATE TABLE post_like_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_category TEXT NOT NULL CHECK (post_category IN ('tech', 'life')),
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  liked_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (post_category, post_slug, visitor_id)
);

-- 인덱스
CREATE INDEX post_likes_lookup_idx ON post_likes (post_category, post_slug);
CREATE INDEX post_like_logs_post_idx ON post_like_logs (post_category, post_slug);
CREATE INDEX post_like_logs_visitor_idx ON post_like_logs (post_category, post_slug, visitor_id);

-- RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_like_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_read" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_all" ON post_likes FOR ALL USING (true);
CREATE POLICY "post_like_logs_read" ON post_like_logs FOR SELECT USING (true);
CREATE POLICY "post_like_logs_all" ON post_like_logs FOR ALL USING (true);

-- 좋아요 토글 함수 (Atomic)
-- 반환: like_count, liked (현재 좋아요 상태)
CREATE OR REPLACE FUNCTION toggle_post_like(
  p_category TEXT,
  p_slug TEXT,
  p_visitor_id TEXT
)
RETURNS TABLE(like_count BIGINT, liked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id BIGINT;
  v_like_count BIGINT;
  v_liked BOOLEAN;
BEGIN
  -- 기존 좋아요 기록 확인
  SELECT id INTO v_existing_id
  FROM post_like_logs
  WHERE post_category = p_category
    AND post_slug = p_slug
    AND visitor_id = p_visitor_id;

  IF v_existing_id IS NOT NULL THEN
    -- 이미 좋아요한 상태 → 취소
    DELETE FROM post_like_logs WHERE id = v_existing_id;

    UPDATE post_likes
    SET
      like_count = GREATEST(post_likes.like_count - 1, 0),
      updated_at = NOW()
    WHERE post_category = p_category AND post_slug = p_slug
    RETURNING post_likes.like_count INTO v_like_count;

    v_liked := FALSE;
  ELSE
    -- 새로 좋아요
    INSERT INTO post_like_logs (post_category, post_slug, visitor_id)
    VALUES (p_category, p_slug, p_visitor_id);

    INSERT INTO post_likes (post_category, post_slug, like_count)
    VALUES (p_category, p_slug, 1)
    ON CONFLICT (post_category, post_slug)
    DO UPDATE SET
      like_count = post_likes.like_count + 1,
      updated_at = NOW()
    RETURNING post_likes.like_count INTO v_like_count;

    v_liked := TRUE;
  END IF;

  RETURN QUERY SELECT COALESCE(v_like_count, 0), v_liked;
END;
$$;
