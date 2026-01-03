-- Migration 0011: Force Fix Users
PRAGMA foreign_keys = OFF;

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

-- Limpeza de segurança
DELETE FROM study_sessions;
DELETE FROM revisions;
DELETE FROM study_cycle;
DELETE FROM cycle_history;
DELETE FROM subjects;
DELETE FROM topics;

PRAGMA foreign_keys = ON;
