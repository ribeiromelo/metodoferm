-- Migration 0005: Add Cycle History

CREATE TABLE IF NOT EXISTS cycle_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  total_subjects INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed', -- 'completed', 'partial'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cycle_history_user_date ON cycle_history(user_id, date);
