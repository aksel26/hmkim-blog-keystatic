-- Supabase Schema for AI Agent Web Service
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tech',
  template TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  current_step TEXT,
  progress INTEGER DEFAULT 0,

  -- State data (JSON)
  research_data JSONB,
  draft_content TEXT,
  final_content TEXT,
  metadata JSONB,
  review_result JSONB,
  validation_result JSONB,

  -- Human review
  human_approval BOOLEAN,
  human_feedback TEXT,

  -- Output
  filepath TEXT,
  pr_result JSONB,
  commit_hash TEXT,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress logs table
CREATE TABLE IF NOT EXISTS progress_logs (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_progress_logs_job_id ON progress_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_created_at ON progress_logs(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust based on your auth requirements)
-- For development, allow all operations
CREATE POLICY "Allow all operations on jobs" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on progress_logs" ON progress_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for progress_logs (for SSE streaming)
ALTER PUBLICATION supabase_realtime ADD TABLE progress_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
