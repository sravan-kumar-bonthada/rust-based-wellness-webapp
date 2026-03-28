use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

#[derive(sqlx::FromRow, Serialize)]
pub struct Resource {
    pub id: Uuid,
    pub title: String,
    pub content_type: String,
    pub category: Option<String>,
    pub content_url: Option<String>,
    pub preview_text: Option<String>,
    pub thumbnail_url: Option<String>,
}

pub async fn list_resources(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let resources: Vec<Resource> = sqlx::query_as(
        "SELECT id, title, content_type, category, content_url, preview_text, thumbnail_url FROM educational_resources ORDER BY created_at DESC"
    ).fetch_all(&pool).await.unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({ "data": resources }))).into_response()
}
