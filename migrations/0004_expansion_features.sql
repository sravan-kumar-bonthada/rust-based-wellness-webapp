-- 0004_expansion_features.sql
-- Expansion features for MindfulAI: Community, Meditations, and Resources

-- 1. Community Features
CREATE TABLE IF NOT EXISTS community_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    tags            TEXT[],
    like_count      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_likes (
    post_id         UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- 2. Meditation Features
CREATE TABLE IF NOT EXISTS meditations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    audio_url       TEXT NOT NULL,
    thumbnail_url   TEXT,
    duration_seconds INT NOT NULL,
    category        VARCHAR(50), -- e.g., 'Anxiety', 'Sleep', 'Focus'
    difficulty      VARCHAR(20) DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Educational Resources
CREATE TABLE IF NOT EXISTS educational_resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    content_type    VARCHAR(20) NOT NULL, -- 'Article', 'Video', 'Guide'
    category        VARCHAR(50), -- e.g., 'CBT Basics', 'Self-Care'
    content_url     TEXT, -- Link to full article or video
    preview_text    TEXT,
    thumbnail_url   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some initial data
INSERT INTO meditations (title, description, audio_url, duration_seconds, category) VALUES
('Morning Calm', 'Start your day with a peaceful mind.', 'https://example.com/audio/morning-calm.mp3', 300, 'Morning'),
('Anxiety Relief', 'Deep breathing exercises for quick relief.', 'https://example.com/audio/anxiety-relief.mp3', 600, 'Anxiety'),
('Deep Sleep', 'Guided visualization to help you fall asleep.', 'https://example.com/audio/deep-sleep.mp3', 900, 'Sleep');

INSERT INTO educational_resources (title, content_type, category, preview_text) VALUES
('Understanding CBT', 'Article', 'CBT Basics', 'Learn the fundamentals of Cognitive Behavioral Therapy.'),
('The Power of Mindfulness', 'Guide', 'Self-Care', 'A comprehensive guide to practicing mindfulness daily.');
