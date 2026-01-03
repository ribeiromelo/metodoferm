INSERT INTO subjects (name, color) VALUES 
('Português', '#3b82f6'),
('Direito Constitucional', '#eab308'),
('Informática', '#ef4444');

INSERT INTO topics (subject_id, name) VALUES 
(1, 'Crase'), (1, 'Sintaxe'), (1, 'Interpretação de Texto'),
(2, 'Direitos Fundamentais'), (2, 'Organização do Estado'),
(3, 'Segurança da Informação'), (3, 'Excel');

INSERT INTO study_cycle (subject_id, duration_minutes, sort_order) VALUES
(1, 60, 1),
(2, 60, 2),
(3, 45, 3);
