-- Seed: Histórico Fictício de 31/12/2025

-- 1. Inserir Resumo do Ciclo (Isso faz aparecer na lista de Histórico)
INSERT INTO cycle_history (user_id, date, total_subjects, total_minutes, status)
VALUES (1, '2025-12-31', 2, 95, 'completed');

-- 2. Inserir Sessões de Estudo (Isso faz aparecer nos gráficos do Dashboard)
-- Assumindo IDs genéricos para Gastro/Infecto (pegando os primeiros que achar)
-- Se não achar, não insere, mas o histórico acima garante a lista.

INSERT INTO study_sessions (user_id, subject_id, topic_id, duration_seconds, questions_total, questions_correct, created_at)
SELECT 1, id, NULL, 3600, 20, 18, '2025-12-31 14:00:00' 
FROM subjects 
ORDER BY id ASC LIMIT 1;

INSERT INTO study_sessions (user_id, subject_id, topic_id, duration_seconds, questions_total, questions_correct, created_at)
SELECT 1, id, NULL, 2100, 15, 12, '2025-12-31 15:30:00' 
FROM subjects 
ORDER BY id DESC LIMIT 1;
