use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services;

pub async fn list_modules(Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    match services::cbt::list_modules(&pool).await {
        Ok(modules) => (StatusCode::OK, Json(serde_json::json!({ "data": modules }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn get_module(Extension(pool): Extension<PgPool>, Path(module_id): Path<String>) -> impl IntoResponse {
    match services::cbt::get_module(&pool, &module_id).await {
        Ok(Some(module)) => {
            let steps = services::cbt::get_module_steps(&pool, &module_id).await.unwrap_or_default();
            (StatusCode::OK, Json(serde_json::json!({
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "duration_minutes": module.duration_minutes,
                "steps": steps
            }))).into_response()
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "module not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

#[derive(Deserialize)]
pub struct StartSessionRequest { pub module_type: String }

pub async fn start_session(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<StartSessionRequest>) -> impl IntoResponse {
    match services::cbt::start_session(&pool, auth.user_id, &req.module_type).await {
        Ok(session) => (StatusCode::CREATED, Json(session)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn list_cbt_sessions(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    match services::cbt::list_sessions(&pool, auth.user_id).await {
        Ok(sessions) => (StatusCode::OK, Json(serde_json::json!({ "data": sessions }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn get_cbt_session(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(session_id): Path<Uuid>) -> impl IntoResponse {
    match services::cbt::get_session(&pool, session_id, auth.user_id).await {
        Ok(Some(session)) => (StatusCode::OK, Json(session)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "session not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

#[derive(Deserialize)]
pub struct RespondStepRequest { pub step_id: i32, pub response: String }

pub async fn respond_step(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(session_id): Path<Uuid>, Json(req): Json<RespondStepRequest>) -> impl IntoResponse {
    match services::cbt::respond_step(&pool, session_id, auth.user_id, req.step_id, req.response).await {
        Ok(session) => (StatusCode::OK, Json(session)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn complete_session(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(session_id): Path<Uuid>) -> impl IntoResponse {
    match services::cbt::complete_session(&pool, session_id, auth.user_id).await {
        Ok(session) => (StatusCode::OK, Json(serde_json::json!({ "message": "Session completed!", "session": session }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn list_thought_records(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow, Serialize)]
    struct ThoughtRow { id: Uuid, trigger: String, emotion: Option<String>, reframed: Option<String>, created_at: chrono::DateTime<chrono::Utc> }

    let rows: Vec<ThoughtRow> = sqlx::query_as(
        "SELECT id, trigger, emotion, reframed, created_at FROM thought_records WHERE user_id = $1 ORDER BY created_at DESC"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({"data": rows}))).into_response()
}

#[derive(Deserialize)]
pub struct CreateThoughtRecord { pub trigger: String, pub emotion: String, pub reframed: String }

pub async fn create_thought_record(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreateThoughtRecord>) -> impl IntoResponse {
    let res = sqlx::query("INSERT INTO thought_records (user_id, trigger, emotion, reframed) VALUES ($1, $2, $3, $4) RETURNING id")
        .bind(auth.user_id).bind(&req.trigger).bind(&req.emotion).bind(&req.reframed)
        .fetch_one(&pool).await;

    match res {
        Ok(r) => {
            let id: Uuid = r.get("id");
            (StatusCode::CREATED, Json(serde_json::json!({"id": id, "trigger": req.trigger, "emotion": req.emotion, "reframed": req.reframed}))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn get_behavioral_tasks(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    // Fetch recent mood for personalization
    let mood: Option<i32> = sqlx::query_scalar("SELECT mood_score FROM mood_entries WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1")
        .bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None);

    let prompt = format!("The user's current mood score is {}/10. Suggest 4 specific, small, low-effort behavioral activation tasks for mental wellness. Output ONLY a valid JSON array of strings. Example: [\"Take a 5-minute walk\", \"Water a plant\"].", mood.unwrap_or(5));

    match services::openai::completion("You are a helpful behavioral therapist. Return pure JSON array of strings.", &prompt).await {
        Ok(resp) => {
            let tasks: Vec<String> = serde_json::from_str(&resp).unwrap_or_else(|_| vec![
                "Take a 10-minute walk".into(),
                "Call a friend".into()
            ]);
            (StatusCode::OK, Json(serde_json::json!({ "tasks": tasks }))).into_response()
        },
        Err(_) => {
            (StatusCode::OK, Json(serde_json::json!({"tasks": ["Take a 10-minute walk","Call a friend","Do something creative","Cook a healthy meal"]}))).into_response()
        }
    }
}
