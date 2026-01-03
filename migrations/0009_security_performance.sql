-- Migration 0009: Security & Performance

-- 1. Security: Add Session Token to Users
ALTER TABLE users ADD COLUMN token TEXT;

-- 2. Performance: Add Indices for heavy queries
-- Speed up Dashboard aggregation (Date filtering)
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_revisions_user_date ON revisions(user_id, created_at);

-- Speed up Cycle History lookup
CREATE INDEX IF NOT EXISTS idx_cycle_history_user ON cycle_history(user_id);

-- Speed up Cycle Sorting
CREATE INDEX IF NOT EXISTS idx_cycle_user_order ON study_cycle(user_id, sort_order);
