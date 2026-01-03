-- Migration 0002: Add Users and Multi-tenancy

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Em produção seria hash, aqui simplificado para o MVP
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar user_id nas tabelas existentes (SQLite não suporta ADD COLUMN com NOT NULL fácil, então vamos recriar ou aceitar NULL por enquanto e limpar depois)
-- Para este sandbox, vamos recriar as tabelas para garantir integridade.

DROP TABLE IF EXISTS study_sessions;
DROP TABLE IF EXISTS study_cycle;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS subjects;

CREATE TABLE subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE study_cycle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  topic_id INTEGER,
  duration_seconds INTEGER NOT NULL,
  questions_total INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);
