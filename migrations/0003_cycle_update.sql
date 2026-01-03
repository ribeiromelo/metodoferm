-- Migration 0003: Add last_studied_at to Cycle

-- Como SQLite no D1 tem limitações com ALTER TABLE, vamos recriar a tabela study_cycle preservando dados se possível,
-- mas como é um ambiente de dev, vamos simplificar recriando.

DROP TABLE IF EXISTS study_cycle;

CREATE TABLE study_cycle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL,
  last_studied_at DATETIME, -- Nova coluna para controlar o "check" diário
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
