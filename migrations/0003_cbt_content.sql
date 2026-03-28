-- 0003_cbt_content.sql
-- Migration to store CBT content in the database

CREATE TABLE IF NOT EXISTS cbt_modules (
    id                VARCHAR(50) PRIMARY KEY,
    title             TEXT NOT NULL,
    description       TEXT,
    duration_minutes  INT DEFAULT 10,
    sort_order        INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cbt_steps (
    id                SERIAL PRIMARY KEY,
    module_id         VARCHAR(50) REFERENCES cbt_modules(id) ON DELETE CASCADE,
    step_order        INT NOT NULL,
    step_type         VARCHAR(20) NOT NULL, -- 'info' or 'input'
    content           TEXT, -- For 'info' type
    question          TEXT, -- For 'input' type
    placeholder       TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Data (from get_cbt_modules in cbt.rs)
INSERT INTO cbt_modules (id, title, description, duration_minutes, sort_order) VALUES
('understanding-anxiety', 'Understanding Anxiety', 'Learn how anxiety works and how to break the cycle.', 15, 1),
('cognitive-distortions', 'Cognitive Distortions', 'Identify common thinking traps that negatively affect mood.', 20, 2),
('challenging-thoughts', 'Challenging Thoughts: The Evidence Test', 'Techniques to reframe negative thinking patterns.', 25, 3),
('behavioral-activation', 'Behavioral Activation', 'How taking action can improve your emotional state.', 20, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cbt_steps (module_id, step_order, step_type, content, question) VALUES
('understanding-anxiety', 1, 'info', 'Anxiety is a natural human response to perceived threats.', NULL),
('understanding-anxiety', 2, 'input', NULL, 'Describe a recent moment when you felt anxious. What triggered it?'),
('understanding-anxiety', 3, 'info', 'The anxiety cycle: Trigger → Thought → Physical Sensation → Behavior → Relief → Repeat.', NULL),
('understanding-anxiety', 4, 'input', NULL, 'In your example, what thought followed the trigger?'),
('understanding-anxiety', 5, 'info', 'Recognizing the thought is the first step towards challenging it.', NULL),

('cognitive-distortions', 1, 'info', 'Cognitive distortions are irrational thought patterns: all-or-nothing thinking, catastrophizing, mind-reading.', NULL),
('cognitive-distortions', 2, 'input', NULL, 'Write down a negative thought you had recently.'),
('cognitive-distortions', 3, 'input', NULL, 'Which cognitive distortion might this fall into?'),
('cognitive-distortions', 4, 'info', 'Identifying the distortion separates the thought from reality.', NULL),

('challenging-thoughts', 1, 'info', 'Welcome to the Evidence Test. Evaluate how accurate your distressing thought actually is.', NULL),
('challenging-thoughts', 2, 'input', NULL, 'What is the thought you want to challenge?'),
('challenging-thoughts', 3, 'input', NULL, 'What is the factual evidence that SUPPORTS this thought?'),
('challenging-thoughts', 4, 'input', NULL, 'What is the factual evidence that CONTRADICTS this thought?'),
('challenging-thoughts', 5, 'info', 'Review both sides. Is the evidence balanced?', NULL),
('challenging-thoughts', 6, 'input', NULL, 'Write a new, more balanced thought.'),

('behavioral-activation', 1, 'info', 'Behavioral activation: doing small things to improve mood even when you don''t feel like it.', NULL),
('behavioral-activation', 2, 'input', NULL, 'List 3 activities that used to bring you joy.'),
('behavioral-activation', 3, 'input', NULL, 'When could you schedule one of these this week?'),
('behavioral-activation', 4, 'info', 'Action precedes motivation. Even a small step will shift your mood.', NULL)
ON CONFLICT DO NOTHING;
