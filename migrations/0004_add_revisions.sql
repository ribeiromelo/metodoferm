-- Migration 0004: Add Revisions Table

CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  topic_id INTEGER, -- Opcional, pode ser revisão geral da matéria
  method TEXT NOT NULL, -- 'flashcard', 'questions', 'summary', 'class', 'other'
  duration_seconds INTEGER NOT NULL,
  questions_total INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_revisions_user ON revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_revisions_date ON revisions(created_at);
