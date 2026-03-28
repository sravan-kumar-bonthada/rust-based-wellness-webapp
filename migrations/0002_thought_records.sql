-- Add thought_records table
CREATE TABLE IF NOT EXISTS thought_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    trigger         TEXT NOT NULL,
    emotion         VARCHAR(100),
    reframed        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
