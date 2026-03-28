-- 0006_b2b_schema.sql
-- B2B Multi-tenant schema: organizations, members, invites

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(30) DEFAULT 'starter',
    billing_email   VARCHAR(255),
    max_seats       INT DEFAULT 10,
    logo_url        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Org Members (join table: org <-> user with role)
CREATE TABLE IF NOT EXISTS org_members (
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin' | 'member'
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'invited' | 'suspended'
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org  ON org_members(org_id);

-- Org Invites (email-based invite tokens)
CREATE TABLE IF NOT EXISTS org_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    invite_token    TEXT NOT NULL UNIQUE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member',
    invited_by      UUID REFERENCES users(id),
    accepted        BOOLEAN DEFAULT false,
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON org_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_org_invites_org   ON org_invites(org_id);

-- Alter users: add org_id and role columns (B2B context)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS role   VARCHAR(20) NOT NULL DEFAULT 'member';

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
