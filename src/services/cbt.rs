use crate::models::cbt::{CbtModule, CbtStep, CbtSession};
use anyhow::Context;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_modules(pool: &PgPool) -> anyhow::Result<Vec<CbtModule>> {
    let rows = sqlx::query_as::<_, CbtModule>(
        "SELECT id, title, description, duration_minutes, sort_order, created_at FROM cbt_modules ORDER BY sort_order ASC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn get_module(pool: &PgPool, module_id: &str) -> anyhow::Result<Option<CbtModule>> {
    let row = sqlx::query_as::<_, CbtModule>(
        "SELECT id, title, description, duration_minutes, sort_order, created_at FROM cbt_modules WHERE id = $1"
    )
    .bind(module_id)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}

pub async fn get_module_steps(pool: &PgPool, module_id: &str) -> anyhow::Result<Vec<CbtStep>> {
    let rows = sqlx::query_as::<_, CbtStep>(
        "SELECT id, module_id, step_order, step_type, content, question, placeholder, created_at FROM cbt_steps WHERE module_id = $1 ORDER BY step_order ASC"
    )
    .bind(module_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn start_session(pool: &PgPool, user_id: Uuid, module_type: &str) -> anyhow::Result<CbtSession> {
    let row = sqlx::query_as::<_, CbtSession>(
        "INSERT INTO cbt_sessions (user_id, module_type) VALUES ($1, $2) RETURNING id, user_id, module_type, stage, responses, completed, score, created_at"
    )
    .bind(user_id)
    .bind(module_type)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn list_sessions(pool: &PgPool, user_id: Uuid) -> anyhow::Result<Vec<CbtSession>> {
    let rows = sqlx::query_as::<_, CbtSession>(
        "SELECT id, user_id, module_type, stage, responses, completed, score, created_at FROM cbt_sessions WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn get_session(pool: &PgPool, session_id: Uuid, user_id: Uuid) -> anyhow::Result<Option<CbtSession>> {
    let row = sqlx::query_as::<_, CbtSession>(
        "SELECT id, user_id, module_type, stage, responses, completed, score, created_at FROM cbt_sessions WHERE id = $1 AND user_id = $2"
    )
    .bind(session_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}

pub async fn respond_step(pool: &PgPool, session_id: Uuid, user_id: Uuid, step_id: i32, response: String) -> anyhow::Result<CbtSession> {
    let mut session = get_session(pool, session_id, user_id).await?
        .context("session not found")?;

    let mut responses = session.responses.unwrap_or(serde_json::json!({}));
    responses[step_id.to_string()] = serde_json::json!(response);
    
    let new_stage = (session.stage.unwrap_or(1)) + 1;

    let row = sqlx::query_as::<_, CbtSession>(
        "UPDATE cbt_sessions SET stage = $1, responses = $2 WHERE id = $3 RETURNING id, user_id, module_type, stage, responses, completed, score, created_at"
    )
    .bind(new_stage)
    .bind(responses)
    .bind(session_id)
    .fetch_one(pool)
    .await?;
    
    Ok(row)
}

pub async fn complete_session(pool: &PgPool, session_id: Uuid, user_id: Uuid) -> anyhow::Result<CbtSession> {
    let row = sqlx::query_as::<_, CbtSession>(
        "UPDATE cbt_sessions SET completed = true, score = 100 WHERE id = $1 AND user_id = $2 RETURNING id, user_id, module_type, stage, responses, completed, score, created_at"
    )
    .bind(session_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    // Award points
    sqlx::query(
        "INSERT INTO user_points (user_id, total_points, last_activity) VALUES ($1, 50, CURRENT_DATE) 
         ON CONFLICT (user_id) DO UPDATE SET total_points = user_points.total_points + 50, last_activity = CURRENT_DATE"
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(row)
}
