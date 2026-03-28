use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::Serialize;
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

#[derive(sqlx::FromRow, Serialize)]
struct NotificationRow {
    id: Uuid,
    r#type: Option<String>,
    title: Option<String>,
    body: Option<String>,
    is_read: Option<bool>,
    created_at: DateTime<Utc>,
}

pub async fn list_notifications(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let rows: Vec<NotificationRow> = sqlx::query_as(
        "SELECT id, type, title, body, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let unread_count = rows.iter().filter(|n| !n.is_read.unwrap_or(false)).count();
    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "type": r.r#type, "title": r.title, "body": r.body,
        "is_read": r.is_read, "created_at": r.created_at,
    })).collect();

    (StatusCode::OK, Json(serde_json::json!({"data": data, "unread_count": unread_count}))).into_response()
}

pub async fn mark_read(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(notif_id): Path<Uuid>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2")
        .bind(notif_id).bind(auth.user_id).execute(&pool).await;
    (StatusCode::OK, Json(serde_json::json!({"message": "marked as read"}))).into_response()
}

pub async fn mark_read_all(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE notifications SET is_read = true WHERE user_id = $1")
        .bind(auth.user_id).execute(&pool).await;
    (StatusCode::OK, Json(serde_json::json!({"message": "all marked as read"}))).into_response()
}

pub async fn update_preferences(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(prefs): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query("INSERT INTO user_profiles (user_id, notification_prefs) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET notification_prefs = EXCLUDED.notification_prefs")
        .bind(auth.user_id).bind(prefs).execute(&pool).await;
    (StatusCode::OK, Json(serde_json::json!({"message": "preferences updated"}))).into_response()
}
