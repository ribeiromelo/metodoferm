-- Tabela de Matérias (Ex: Português, Direito Constitucional)
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6', -- Cor para identificar no gráfico/ciclo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Assuntos/Tópicos do Edital
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT 0, -- Se já finalizou a teoria
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Tabela do Ciclo de Estudos (A ordem que deve ser estudada)
CREATE TABLE IF NOT EXISTS cycle_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    study_order INTEGER NOT NULL, -- Posição no ciclo (1, 2, 3...)
    duration_minutes INTEGER DEFAULT 60, -- Meta de tempo para essa matéria no ciclo
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Tabela de Sessões de Estudo (O histórico real)
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    topic_id INTEGER, -- Pode ser nulo se for estudo geral ou revisão
    duration_seconds INTEGER NOT NULL, -- Tempo líquido estudado
    questions_total INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    notes TEXT,
    study_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_cycle_order ON cycle_items(study_order);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(study_date);
