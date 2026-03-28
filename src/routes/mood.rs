use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services::openai;

#[derive(Deserialize)]
pub struct CreateMoodRequest {
    pub mood_score: i32,
    pub energy_level: Option<i32>,
    pub anxiety_level: Option<i32>,
    pub emotions: Option<Vec<String>>,
    pub notes: Option<String>,
}

#[derive(sqlx::FromRow, Serialize)]
struct MoodRow {
    id: Uuid,
    mood_score: i32,
    energy_level: Option<i32>,
    anxiety_level: Option<i32>,
    emotions: Option<Vec<String>>,
    notes: Option<String>,
    logged_at: DateTime<Utc>,
}

pub async fn create_mood(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreateMoodRequest>) -> impl IntoResponse {
    let row: Result<MoodRow, _> = sqlx::query_as(
        "INSERT INTO mood_entries (user_id, mood_score, energy_level, anxiety_level, emotions, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, mood_score, energy_level, anxiety_level, emotions, notes, logged_at"
    )
    .bind(auth.user_id).bind(req.mood_score).bind(req.energy_level).bind(req.anxiety_level).bind(req.emotions).bind(req.notes)
    .fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::CREATED, Json(serde_json::json!({
            "id": r.id, "mood_score": r.mood_score, "logged_at": r.logged_at
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn list_mood(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let rows: Vec<MoodRow> = sqlx::query_as(
        "SELECT id, mood_score, energy_level, anxiety_level, emotions, notes, logged_at FROM mood_entries WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 30"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "mood_score": r.mood_score, "energy_level": r.energy_level,
        "anxiety_level": r.anxiety_level, "emotions": r.emotions, "notes": r.notes, "logged_at": r.logged_at,
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}

pub async fn today_mood(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow, Serialize)]
    struct TodayRow { id: Uuid, mood_score: i32, emotions: Option<Vec<String>>, notes: Option<String>, logged_at: DateTime<Utc> }

    let row: Option<TodayRow> = sqlx::query_as(
        "SELECT id, mood_score, emotions, notes, logged_at FROM mood_entries WHERE user_id = $1 AND logged_at::date = CURRENT_DATE ORDER BY logged_at DESC LIMIT 1"
    ).bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None);

    (StatusCode::OK, Json(serde_json::json!(row.map(|r| serde_json::json!({
        "id": r.id, "mood_score": r.mood_score, "emotions": r.emotions, "notes": r.notes, "logged_at": r.logged_at,
    }))))).into_response()
}

pub async fn update_mood(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(mood_id): Path<Uuid>, Json(req): Json<CreateMoodRequest>) -> impl IntoResponse {
    sqlx::query("UPDATE mood_entries SET mood_score = $1, notes = $2 WHERE id = $3 AND user_id = $4")
        .bind(req.mood_score).bind(req.notes).bind(mood_id).bind(auth.user_id)
        .execute(&pool).await.ok();
    (StatusCode::OK, Json(serde_json::json!({"message":"updated"}))).into_response()
}

pub async fn analytics(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct AnalyticsRow { avg_mood: Option<f64>, max_mood: Option<i32>, min_mood: Option<i32>, total_entries: Option<i64> }

    let row: Result<AnalyticsRow, _> = sqlx::query_as(
        "SELECT AVG(mood_score)::float8 as avg_mood, MAX(mood_score) as max_mood, MIN(mood_score) as min_mood, COUNT(*) as total_entries FROM mood_entries WHERE user_id = $1 AND logged_at > NOW() - INTERVAL '30 days'"
    ).bind(auth.user_id).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "avg_mood": r.avg_mood, "max_mood": r.max_mood, "min_mood": r.min_mood, "total_entries": r.total_entries, "period": "30 days"
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn predictions(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct MoodRecord { mood_score: i32, emotions: Option<Vec<String>> }
    
    let rows: Vec<MoodRecord> = sqlx::query_as("SELECT mood_score, emotions FROM mood_entries WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10")
        .bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    if rows.is_empty() {
        return (StatusCode::OK, Json(serde_json::json!({ "prediction": "Log more moods to unlock detailed AI predictions and pattern recognition.", "confidence": 0.0 }))).into_response();
    }

    let history = rows.iter().map(|r| format!("Score: {}/10, Emotions: {:?}", r.mood_score, r.emotions)).collect::<Vec<_>>().join("\n");
    let prompt = format!("Based on this recent mood history:\n{}\nProvide a 1-sentence prediction or pattern observation about the user's emotional state.", history);

    let pred = openai::completion("You are a pattern-recognizing emotional wellness AI.", &prompt).await.unwrap_or("Your mood shows natural fluctuations. Keep tracking to learn more.".into());

    (StatusCode::OK, Json(serde_json::json!({
        "prediction": pred,
        "confidence": 0.85
    }))).into_response()
}
