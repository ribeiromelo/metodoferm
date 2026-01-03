-- Migration 0008: Add Goals to Users table
-- Adiciona colunas para metas diárias e semanais com valores padrão conservadores

ALTER TABLE users ADD COLUMN daily_goal_minutes INTEGER DEFAULT 60;
ALTER TABLE users ADD COLUMN weekly_goal_questions INTEGER DEFAULT 100;
