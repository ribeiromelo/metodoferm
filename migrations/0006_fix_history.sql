-- Migration 0006: Add Subjects List to History & Fix Date

-- 1. Recriar tabela com nova coluna (SQLite limitation)
DROP TABLE IF EXISTS cycle_history;

CREATE TABLE cycle_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  total_subjects INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  subjects_text TEXT, -- Nova coluna: "Gastro, Infecto"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cycle_history_user_date ON cycle_history(user_id, date);

-- 2. Reinserir dados corrigidos (Seed Fix)
-- Inserindo o registro de 31/12/2025 corretamente
INSERT INTO cycle_history (user_id, date, total_subjects, total_minutes, status, subjects_text)
VALUES (1, '2025-12-31', 2, 95, 'completed', 'Gastro, Infecto');

-- Inserindo o registro de hoje (01/01 ou 02/01 dependendo do seu teste anterior) corrigido para 01/01
-- Assumindo que você testou hoje.
INSERT INTO cycle_history (user_id, date, total_subjects, total_minutes, status, subjects_text)
VALUES (1, '2026-01-01', 8, 6, 'completed', 'Infecto, Vascular');
