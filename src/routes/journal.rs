use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services::openai;

#[derive(Deserialize)]
pub struct CreateJournalRequest {
    pub title: Option<String>,
    pub content: String,
    pub tags: Option<Vec<String>>,
}

#[derive(sqlx::FromRow, Serialize)]
struct JournalRow {
    id: Uuid,
    title: Option<String>,
    content: String,
    ai_reflection: Option<String>,
    tags: Option<Vec<String>>,
    sentiment_score: Option<f64>,
    created_at: DateTime<Utc>,
}

pub async fn create_entry(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreateJournalRequest>) -> impl IntoResponse {
    let row: Result<JournalRow, _> = sqlx::query_as(
        "INSERT INTO journal_entries (user_id, title, content, tags) VALUES ($1, $2, $3, $4) RETURNING id, title, content, ai_reflection, tags, sentiment_score, created_at"
    ).bind(auth.user_id).bind(&req.title).bind(&req.content).bind(req.tags.as_deref())
    .fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::CREATED, Json(serde_json::json!({
            "id": r.id, "title": r.title, "content": r.content, "tags": r.tags, "created_at": r.created_at,
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn list_entries(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow, Serialize)]
    struct ListRow { id: Uuid, title: Option<String>, content: String, tags: Option<Vec<String>>, sentiment_score: Option<f64>, created_at: DateTime<Utc> }

    let rows: Vec<ListRow> = sqlx::query_as(
        "SELECT id, title, LEFT(content, 200) as content, tags, sentiment_score, created_at FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "title": r.title, "preview": r.content, "tags": r.tags,
        "sentiment_score": r.sentiment_score, "created_at": r.created_at,
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}

pub async fn get_entry(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(entry_id): Path<Uuid>) -> impl IntoResponse {
    let row: Result<JournalRow, _> = sqlx::query_as(
        "SELECT id, title, content, ai_reflection, tags, sentiment_score, created_at FROM journal_entries WHERE id = $1 AND user_id = $2"
    ).bind(entry_id).bind(auth.user_id).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "id": r.id, "title": r.title, "content": r.content, "ai_reflection": r.ai_reflection,
            "tags": r.tags, "sentiment_score": r.sentiment_score, "created_at": r.created_at,
        }))).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "not found"}))).into_response(),
    }
}

pub async fn update_entry(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(entry_id): Path<Uuid>, Json(req): Json<CreateJournalRequest>) -> impl IntoResponse {
    sqlx::query("UPDATE journal_entries SET title = $1, content = $2, tags = $3 WHERE id = $4 AND user_id = $5")
        .bind(&req.title).bind(&req.content).bind(req.tags.as_deref()).bind(entry_id).bind(auth.user_id)
        .execute(&pool).await.ok();
    (StatusCode::OK, Json(serde_json::json!({"message": "updated"}))).into_response()
}

pub async fn delete_entry(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(entry_id): Path<Uuid>) -> impl IntoResponse {
    let _ = sqlx::query("DELETE FROM journal_entries WHERE id = $1 AND user_id = $2")
        .bind(entry_id).bind(auth.user_id).execute(&pool).await;
    (StatusCode::NO_CONTENT, ()).into_response()
}

pub async fn insights(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct InsightRow { total: Option<i64>, avg_sentiment: Option<f64> }
    let stats: Result<InsightRow, _> = sqlx::query_as(
        "SELECT COUNT(*) as total, AVG(sentiment_score)::float8 as avg_sentiment FROM journal_entries WHERE user_id = $1"
    ).bind(auth.user_id).fetch_one(&pool).await;

    // Fetch last 3 entries for context
    let recent_entries: Vec<String> = sqlx::query_scalar("SELECT LEFT(content, 300) FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3")
        .bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let ai_insight = if recent_entries.is_empty() {
        "Start writing in your journal to receive personalized AI insights!".to_string()
    } else {
        let prompt = format!("Based on these recent journal entries, provide a 1-2 sentence empathetic observation or insight:\n\n{}", recent_entries.join("\n\n"));
        openai::completion("You are an insightful journaling guide.", &prompt).await.unwrap_or("Keep exploring your thoughts!".into())
    };

    match stats {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "total_entries": r.total, "avg_sentiment": r.avg_sentiment,
            "ai_insight": ai_insight,
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}
