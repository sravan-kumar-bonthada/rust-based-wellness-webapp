use crate::models::user::User;
use anyhow::Context;
use argon2::{Argon2, password_hash::{SaltString, PasswordHasher, PasswordVerifier, PasswordHash}};
use jsonwebtoken::{EncodingKey, Header, encode, Algorithm};
use rand::thread_rng;
use serde::{Serialize, Deserialize};
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,           // user_id
    org: Option<String>,   // org_id
    role: String,          // "admin" | "member"
    exp: usize,
}

#[derive(sqlx::FromRow)]
struct LoginRow {
    id: Uuid,
    password_hash: String,
    org_id: Option<Uuid>,
    role: String,
}

/// Register a new user. If org_name is provided, creates an organization and makes the
/// user an admin. Otherwise registers as a standalone member (legacy / invite flow).
pub async fn register_user(
    pool: &PgPool,
    email: &str,
    password: &str,
    org_name: Option<&str>,
) -> anyhow::Result<User> {
    let salt = SaltString::generate(&mut thread_rng());
    let argon = Argon2::default();
    let password_hash = argon
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!(e))?
        .to_string();

    // Determine role: admins create an org during registration
    let role = if org_name.is_some() { "admin" } else { "member" };

    let rec: User = sqlx::query_as::<_, User>(
        r#"INSERT INTO users (email, password_hash, role, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING id, email, password_hash, display_name, avatar_url, is_anonymous,
                     subscription, onboarding_done, org_id, role, created_at, updated_at
        "#,
    )
    .bind(email)
    .bind(&password_hash)
    .bind(role)
    .fetch_one(pool)
    .await
    .context("insert user failed")?;

    // If company name provided: create org and link user to it as admin
    if let Some(name) = org_name {
        let slug = slugify(name);
        let org_id: Uuid = sqlx::query_scalar(
            r#"INSERT INTO organizations (name, slug, billing_email)
               VALUES ($1, $2, $3)
               RETURNING id"#,
        )
        .bind(name)
        .bind(&slug)
        .bind(email)
        .fetch_one(pool)
        .await
        .context("insert org failed")?;

        // Link user to org in users table
        sqlx::query("UPDATE users SET org_id = $1, role = 'admin' WHERE id = $2")
            .bind(org_id)
            .bind(rec.id)
            .execute(pool)
            .await
            .context("link user to org failed")?;

        // Insert into org_members
        sqlx::query(
            r#"INSERT INTO org_members (org_id, user_id, role, status)
               VALUES ($1, $2, 'admin', 'active')
               ON CONFLICT DO NOTHING"#,
        )
        .bind(org_id)
        .bind(rec.id)
        .execute(pool)
        .await
        .context("insert org_member failed")?;
    }

    Ok(rec)
}

pub async fn login_user(pool: &PgPool, email: &str, password: &str) -> anyhow::Result<(String, Option<Uuid>, String)> {
    let rec: LoginRow = sqlx::query_as::<_, LoginRow>(
        r#"SELECT id, password_hash, org_id, role FROM users WHERE email = $1"#,
    )
    .bind(email)
    .fetch_one(pool)
    .await
    .context("user not found")?;

    let parsed = PasswordHash::new(&rec.password_hash).map_err(|e| anyhow::anyhow!(e))?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .map_err(|e| anyhow::anyhow!(e))?;

    // JWT valid for 24h (B2B sessions are longer-lived)
    let exp = (time::OffsetDateTime::now_utc() + time::Duration::hours(24)).unix_timestamp() as usize;
    let claims = Claims {
        sub: rec.id.to_string(),
        org: rec.org_id.map(|id| id.to_string()),
        role: rec.role.clone(),
        exp,
    };

    let token = if let Ok(pk_pem) = env::var("JWT_PRIVATE_KEY_PEM") {
        let encoding_key = EncodingKey::from_rsa_pem(pk_pem.as_bytes())?;
        encode(&Header::new(Algorithm::RS256), &claims, &encoding_key)?
    } else if let Ok(secret) = env::var("JWT_SECRET") {
        let encoding_key = EncodingKey::from_secret(secret.as_bytes());
        encode(&Header::new(Algorithm::HS256), &claims, &encoding_key)?
    } else {
        anyhow::bail!("No JWT key configured (JWT_PRIVATE_KEY_PEM or JWT_SECRET)");
    };

    Ok((token, rec.org_id, rec.role))
}

pub async fn find_or_create_sso_user(
    pool: &PgPool,
    email: &str,
    display_name: Option<&str>,
) -> anyhow::Result<(String, Option<Uuid>, String)> {
    // 1. Check if user exists
    let rec = sqlx::query_as::<_, LoginRow>(
        r#"SELECT id, password_hash, org_id, role FROM users WHERE email = $1"#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    let (user_id, org_id, role) = if let Some(r) = rec {
        (r.id, r.org_id, r.role)
    } else {
        // 2. Create new user if not found
        // For SSO, we don't have a password hash, so we'll store a random string or just leave it NULL if DB allows.
        // Our schema likely requires it, so we'll put a placeholder.
        let placeholder_hash = "SSO_USER_NO_PASSWORD"; 
        
        let new_user: User = sqlx::query_as::<_, User>(
            r#"INSERT INTO users (email, password_hash, display_name, role, created_at, updated_at)
               VALUES ($1, $2, $3, 'member', NOW(), NOW())
               RETURNING id, email, password_hash, display_name, avatar_url, is_anonymous,
                         subscription, onboarding_done, org_id, role, created_at, updated_at
            "#,
        )
        .bind(email)
        .bind(placeholder_hash)
        .bind(display_name)
        .fetch_one(pool)
        .await
        .context("insert sso user failed")?;

        (new_user.id, new_user.org_id, new_user.role)
    };

    // 3. Issue JWT
    let exp = (time::OffsetDateTime::now_utc() + time::Duration::hours(24)).unix_timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        org: org_id.map(|id| id.to_string()),
        role: role.clone(),
        exp,
    };

    let token = if let Ok(pk_pem) = env::var("JWT_PRIVATE_KEY_PEM") {
        let encoding_key = EncodingKey::from_rsa_pem(pk_pem.as_bytes())?;
        encode(&Header::new(Algorithm::RS256), &claims, &encoding_key)?
    } else if let Ok(secret) = env::var("JWT_SECRET") {
        let encoding_key = EncodingKey::from_secret(secret.as_bytes());
        encode(&Header::new(Algorithm::HS256), &claims, &encoding_key)?
    } else {
        anyhow::bail!("No JWT key configured");
    };

    Ok((token, org_id, role))
}

fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}
