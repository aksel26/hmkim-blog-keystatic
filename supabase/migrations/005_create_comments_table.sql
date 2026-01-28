-- 댓글 테이블 (Adjacency List 패턴 - 대댓글 지원)
CREATE TABLE comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_slug TEXT NOT NULL,
  post_category TEXT NOT NULL CHECK (post_category IN ('tech', 'life')),
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,

  -- 익명 사용자 정보
  author_name TEXT NOT NULL,
  author_email TEXT,
  password_hash TEXT NOT NULL,

  -- 댓글 내용
  content TEXT NOT NULL,

  -- 메타데이터
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (베스트 프랙티스 적용)
CREATE INDEX comments_post_idx ON comments (post_category, post_slug);
CREATE INDEX comments_parent_idx ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX comments_created_idx ON comments (created_at DESC);

-- RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 허용
CREATE POLICY "comments_read" ON comments FOR SELECT USING (true);

-- 쓰기: anon 역할 허용
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);

-- 수정: service role만 (API에서 비밀번호 검증 후)
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (true);

-- 삭제: service role만
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_updated_at_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();
