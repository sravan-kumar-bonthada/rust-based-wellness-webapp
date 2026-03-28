use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

#[derive(sqlx::FromRow, Serialize)]
pub struct Meditation {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub audio_url: String,
    pub thumbnail_url: Option<String>,
    pub duration_seconds: i32,
    pub category: Option<String>,
    pub difficulty: Option<String>,
}

pub async fn list_meditations(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let meditations: Vec<Meditation> = sqlx::query_as(
        "SELECT id, title, description, audio_url, thumbnail_url, duration_seconds, category, difficulty FROM meditations ORDER BY created_at DESC"
    ).fetch_all(&pool).await.unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({ "data": meditations }))).into_response()
}
