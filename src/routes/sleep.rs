use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services::openai;

#[derive(Deserialize)]
pub struct CreateSleepRequest {
    pub sleep_at: DateTime<Utc>,
    pub wake_at: DateTime<Utc>,
    pub quality_score: Option<i32>,
    pub notes: Option<String>,
}

#[derive(sqlx::FromRow, Serialize)]
struct SleepEntryRow {
    id: Uuid,
    sleep_at: DateTime<Utc>,
    wake_at: DateTime<Utc>,
    quality_score: Option<i32>,
    notes: Option<String>,
    created_at: DateTime<Utc>,
}

pub async fn create_sleep(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreateSleepRequest>) -> impl IntoResponse {
    let row: Result<SleepEntryRow, _> = sqlx::query_as(
        "INSERT INTO sleep_entries (user_id, sleep_at, wake_at, quality_score, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, sleep_at, wake_at, quality_score, notes, created_at"
    ).bind(auth.user_id).bind(req.sleep_at).bind(req.wake_at).bind(req.quality_score).bind(req.notes)
    .fetch_one(&pool).await;

    match row {
        Ok(r) => {
            let hours = (r.wake_at - r.sleep_at).num_minutes() as f64 / 60.0;
            (StatusCode::CREATED, Json(serde_json::json!({
                "id": r.id, "sleep_at": r.sleep_at, "wake_at": r.wake_at,
                "quality_score": r.quality_score, "hours": hours, "created_at": r.created_at,
            }))).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn list_sleep(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let rows: Vec<SleepEntryRow> = sqlx::query_as(
        "SELECT id, sleep_at, wake_at, quality_score, notes, created_at FROM sleep_entries WHERE user_id = $1 ORDER BY sleep_at DESC LIMIT 30"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| {
        let hours = (r.wake_at - r.sleep_at).num_minutes() as f64 / 60.0;
        serde_json::json!({
            "id": r.id, "sleep_at": r.sleep_at, "wake_at": r.wake_at,
            "quality_score": r.quality_score, "hours": hours, "notes": r.notes, "created_at": r.created_at,
        })
    }).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}

pub async fn sleep_analytics(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct AnalyticsRow { avg_hours: Option<f64>, avg_quality: Option<f64>, total_entries: Option<i64> }

    let row: Result<AnalyticsRow, _> = sqlx::query_as(
        "SELECT AVG(EXTRACT(EPOCH FROM (wake_at - sleep_at))/3600)::float8 AS avg_hours, AVG(quality_score)::float8 AS avg_quality, COUNT(*) AS total_entries FROM sleep_entries WHERE user_id = $1 AND sleep_at > NOW() - INTERVAL '30 days'"
    ).bind(auth.user_id).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "avg_hours": r.avg_hours.unwrap_or(0.0), "avg_quality": r.avg_quality.unwrap_or(0.0),
            "total_entries": r.total_entries, "period": "30 days",
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn sleep_suggestions(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let recent: Vec<SleepEntryRow> = sqlx::query_as(
        "SELECT id, sleep_at, wake_at, quality_score, notes, created_at FROM sleep_entries WHERE user_id = $1 ORDER BY sleep_at DESC LIMIT 5"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let history = if recent.is_empty() {
        "No recent sleep data.".to_string()
    } else {
        recent.iter().map(|r| {
            let hours = (r.wake_at - r.sleep_at).num_minutes() as f64 / 60.0;
            format!("Hours: {:.1}, Quality: {:?}, Notes: {:?}", hours, r.quality_score, r.notes)
        }).collect::<Vec<_>>().join("\n")
    };

    let prompt = format!(
        "Based on the following recent sleep history:\n{}\nProvide exactly 3 short, helpful, personalized sleep hygiene suggestions. Format them as a JSON array of strings. Only output the JSON array.",
        history
    );
    
    match openai::completion("You are a personalized sleep coach. Return pure JSON array of strings.", &prompt).await {
        Ok(resp) => {
            let parsed: Vec<String> = serde_json::from_str(&resp).unwrap_or_else(|_| vec![
                "Try to go to bed at the same time every night.".into(),
                "Avoid screens 30 minutes before bed.".into()
            ]);
            (StatusCode::OK, Json(serde_json::json!({ "suggestions": parsed }))).into_response()
        }
        Err(e) => {
            tracing::error!("OpenAI error in sleep_suggestions: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}
