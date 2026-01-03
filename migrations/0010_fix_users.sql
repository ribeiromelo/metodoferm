-- Migration 0010: Fix Users Table & Schema
-- Recriando a tabela de usuários com todas as colunas necessárias para a versão final

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  avatar_id TEXT DEFAULT '1',
  cover_color TEXT DEFAULT 'from-indigo-600 to-purple-600',
  daily_goal_minutes INTEGER DEFAULT 60,
  weekly_goal_questions INTEGER DEFAULT 100,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Limpar dados órfãos para evitar erros
DELETE FROM study_sessions WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM revisions WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM study_cycle WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM cycle_history WHERE user_id NOT IN (SELECT id FROM users);
