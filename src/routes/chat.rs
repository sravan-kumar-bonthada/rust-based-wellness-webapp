use axum::{response::IntoResponse, Json, extract::{Path, Query}, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::routes::common;
use crate::services::chat;

#[derive(Deserialize)]
pub struct CreateSessionReq {
    pub session_type: Option<String>,
    pub title: Option<String>,
}

#[derive(Deserialize)]
pub struct ListSessionsQuery {
    // user_id removed, use AuthUser
}

#[derive(Deserialize)]
pub struct SendMessageReq {
    pub content: String,
}

#[derive(Deserialize)]
pub struct ListMessagesQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Deserialize)]
pub struct SuggestionsQuery {
    // user_id removed, use AuthUser
}

#[derive(Serialize)]
struct SimpleResponse<T> {
    data: T,
}

pub async fn create_session(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    Json(req): Json<CreateSessionReq>,
) -> impl IntoResponse {
    match chat::create_session(&pool, auth.user_id, req.session_type.as_deref(), req.title.as_deref()).await {
        Ok(sess) => Ok(Json(SimpleResponse { data: sess })),
        Err(e) => {
            tracing::error!("create session error: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_sessions(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    _q: Query<ListSessionsQuery>,
) -> impl IntoResponse {
    match chat::list_sessions(&pool, auth.user_id).await {
        Ok(list) => Ok(Json(SimpleResponse { data: list })),
        Err(e) => {
            tracing::error!("list sessions error: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_session(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match chat::get_session(&pool, id).await {
        Ok(sess) => Ok(Json(SimpleResponse { data: sess })),
        Err(e) => {
            tracing::error!("get session error: {}", e);
            Err(common::not_implemented())
        }
    }
}

pub async fn delete_session(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    if let Err(e) = chat::delete_session(&pool, id).await {
        tracing::error!("delete session error: {}", e);
    }
    (axum::http::StatusCode::OK, Json(serde_json::json!({})))
}

pub async fn send_message(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
    Json(req): Json<SendMessageReq>,
) -> impl IntoResponse {
    match chat::send_user_message(&pool, id, auth.user_id, &req.content).await {
        Ok(msg) => Ok(Json(SimpleResponse { data: msg })),
        Err(e) => {
            tracing::error!("send message error: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_messages(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
    Query(q): Query<ListMessagesQuery>,
) -> impl IntoResponse {
    let limit = q.limit.unwrap_or(20);
    let offset = q.offset.unwrap_or(0);
    match chat::list_messages(&pool, id, limit, offset).await {
        Ok(msgs) => Ok(Json(SimpleResponse { data: msgs })),
        Err(e) => {
            tracing::error!("list messages error: {}", e);
            Err(common::not_implemented())
        }
    }
}

pub async fn voice_to_text(mut multipart: axum::extract::Multipart) -> impl IntoResponse {
    let mut file_bytes = Vec::new();
    let mut file_name = "audio.webm".to_string();

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().map(|n| n.to_string());
        if name == Some("file".to_string()) {
            if let Some(filename) = field.file_name() {
                file_name = filename.to_string();
            }
            if let Ok(bytes) = field.bytes().await {
                file_bytes = bytes.to_vec();
            }
        }
    }

    if file_bytes.is_empty() {
        return (axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "No audio file provided"}))).into_response();
    }

    let api_key = std::env::var("OPENAI_API_KEY").unwrap_or_default();
    let client = reqwest::Client::new();
    
    let part = reqwest::multipart::Part::bytes(file_bytes)
        .file_name(file_name)
        .mime_str("audio/webm").expect("Invalid mime type");

    let form = reqwest::multipart::Form::new()
        .text("model", "whisper-1")
        .part("file", part);

    let res = client.post("https://api.openai.com/v1/audio/transcriptions")
        .bearer_auth(api_key)
        .multipart(form)
        .send().await;

    match res {
        Ok(r) if r.status().is_success() => {
            let json: serde_json::Value = r.json().await.unwrap_or(serde_json::json!({}));
            (axum::http::StatusCode::OK, Json(serde_json::json!({"text": json["text"]}))).into_response()
        }
        Ok(r) => {
            let err_text = r.text().await.unwrap_or_default();
            tracing::error!("Whisper error: {}", err_text);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": err_text}))).into_response()
        }
        Err(e) => {
            tracing::error!("Reqwest error: {}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}

pub async fn summarize_session(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match chat::summarize_session(&pool, id).await {
        Ok(sum) => (axum::http::StatusCode::OK, Json(serde_json::json!({"summary": sum}))),
        Err(e) => {
            tracing::error!("summarize session error: {}", e);
            common::not_implemented()
        }
    }
}

pub async fn suggestions(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    _q: Query<SuggestionsQuery>,
) -> impl IntoResponse {
    match chat::suggestions(&pool, auth.user_id).await {
        Ok(list) => Ok(Json(SimpleResponse { data: list })),
        Err(e) => {
            tracing::error!("suggestions error: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn export_session(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match chat::export_session(&pool, id).await {
        Ok(txt) => Ok(Json(serde_json::json!({"export": txt}))),
        Err(e) => {
            tracing::error!("export error: {}", e);
            Err(common::not_implemented())
        }
    }
}
