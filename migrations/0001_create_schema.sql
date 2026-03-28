-- 0001_create_schema.sql
-- Initial schema for MindfulAI backend

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core User Management
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    is_anonymous    BOOLEAN DEFAULT false,
    subscription    VARCHAR(20) DEFAULT 'free',
    onboarding_done BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Mental Health Profile
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    anxiety_baseline INT,
    depression_score INT,
    primary_concerns TEXT[],
    therapy_goals   TEXT[],
    timezone        VARCHAR(50),
    notification_prefs JSONB
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type    VARCHAR(30),
    title           TEXT,
    is_active       BOOLEAN DEFAULT true,
    message_count   INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,
    content         TEXT NOT NULL,
    content_type    VARCHAR(20) DEFAULT 'text',
    emotion_detected VARCHAR(30),
    tokens_used     INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at DESC);

-- CBT Modules
CREATE TABLE IF NOT EXISTS cbt_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    module_type     VARCHAR(50),
    stage           INT DEFAULT 1,
    responses       JSONB,
    completed       BOOLEAN DEFAULT false,
    score           INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Mood Tracking
CREATE TABLE IF NOT EXISTS mood_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score      INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    energy_level    INT CHECK (energy_level BETWEEN 1 AND 10),
    anxiety_level   INT CHECK (anxiety_level BETWEEN 1 AND 10),
    emotions        TEXT[],
    notes           TEXT,
    logged_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_user_time ON mood_entries(user_id, logged_at DESC);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT,
    content         TEXT NOT NULL,
    ai_reflection   TEXT,
    tags            TEXT[],
    sentiment_score FLOAT,
    is_private      BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50),
    frequency       VARCHAR(20),
    target_count    INT DEFAULT 1,
    streak_current  INT DEFAULT 0,
    streak_best     INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id        UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    completed_at    DATE NOT NULL,
    notes           TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_log_unique ON habit_logs(habit_id, completed_at);

-- Sleep Tracking
CREATE TABLE IF NOT EXISTS sleep_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    sleep_at        TIMESTAMPTZ NOT NULL,
    wake_at         TIMESTAMPTZ NOT NULL,
    quality_score   INT CHECK (quality_score BETWEEN 1 AND 5),
    notes           TEXT,
    ai_suggestion   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Events (Sensitive — encrypted at rest)
CREATE TABLE IF NOT EXISTS crisis_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    severity        VARCHAR(20),
    trigger_phrase  TEXT,
    escalated_to    VARCHAR(50),
    resolved        BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification
CREATE TABLE IF NOT EXISTS user_points (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    total_points    INT DEFAULT 0,
    level           INT DEFAULT 1,
    badges          TEXT[],
    weekly_streak   INT DEFAULT 0,
    last_activity   DATE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50),
    title           TEXT,
    body            TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
