use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

#[derive(Deserialize)]
pub struct CreatePostRequest {
    pub content: String,
    pub tags: Option<Vec<String>>,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct CommunityPost {
    pub id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub like_count: Option<i32>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_posts(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let posts: Vec<CommunityPost> = if let Some(org_id) = auth.org_id {
        sqlx::query_as(
            r#"SELECT cp.id, cp.user_id, cp.content, cp.tags, cp.like_count, cp.created_at 
               FROM community_posts cp
               JOIN users u ON cp.user_id = u.id
               WHERE u.org_id = $1
               ORDER BY cp.created_at DESC LIMIT 50"#
        ).bind(org_id).fetch_all(&pool).await.unwrap_or_default()
    } else {
        // standalone users see only their own posts (or none, depending on policy)
        sqlx::query_as(
            "SELECT id, user_id, content, tags, like_count, created_at FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
        ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default()
    };

    (StatusCode::OK, Json(serde_json::json!({ "data": posts }))).into_response()
}

pub async fn create_post(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreatePostRequest>) -> impl IntoResponse {
    let row: Result<CommunityPost, _> = sqlx::query_as(
        "INSERT INTO community_posts (user_id, content, tags) VALUES ($1, $2, $3) RETURNING id, user_id, content, tags, like_count, created_at"
    ).bind(auth.user_id).bind(&req.content).bind(&req.tags).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::CREATED, Json(r)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}
