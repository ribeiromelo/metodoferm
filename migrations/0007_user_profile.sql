-- Migration 0007: Add User Profile Fields

-- SQLite no D1 permite adicionar colunas, mas vamos garantir
ALTER TABLE users ADD COLUMN nickname TEXT;
ALTER TABLE users ADD COLUMN avatar_id TEXT DEFAULT '1'; -- ID para avatar pré-definido
ALTER TABLE users ADD COLUMN cover_color TEXT DEFAULT 'from-blue-600 to-indigo-600'; -- Gradiente da capa
