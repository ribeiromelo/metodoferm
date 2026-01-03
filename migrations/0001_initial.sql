-- Migration 0001: Initial Schema

-- Tabela de Matérias (ex: Português, RLM)
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- Cor para os gráficos (Tailwind Blue 500 default)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tópicos/Assuntos (ex: Crase, Sintaxe)
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Tabela do Ciclo de Estudos (A ordem que devo estudar)
CREATE TABLE IF NOT EXISTS study_cycle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL, -- Ordem no ciclo (1, 2, 3...)
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Tabela de Sessões de Estudo (O histórico real)
CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  topic_id INTEGER, -- Opcional, posso estudar a matéria geral
  duration_seconds INTEGER NOT NULL, -- Tempo líquido estudado
  questions_total INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(created_at);
