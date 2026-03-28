use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services::openai;

#[derive(Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub category: Option<String>,
    pub frequency: Option<String>,
}

#[derive(sqlx::FromRow, Serialize)]
struct HabitRow {
    id: Uuid,
    name: String,
    category: Option<String>,
    frequency: Option<String>,
    streak_current: Option<i32>,
    streak_best: Option<i32>,
    is_active: Option<bool>,
    created_at: DateTime<Utc>,
}

pub async fn create_habit(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<CreateHabitRequest>) -> impl IntoResponse {
    let freq = req.frequency.unwrap_or_else(|| "daily".to_string());
    let row: Result<HabitRow, _> = sqlx::query_as(
        "INSERT INTO habits (user_id, name, category, frequency) VALUES ($1, $2, $3, $4) RETURNING id, name, category, frequency, streak_current, streak_best, is_active, created_at"
    ).bind(auth.user_id).bind(&req.name).bind(&req.category).bind(&freq).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::CREATED, Json(serde_json::json!({
            "id": r.id, "name": r.name, "category": r.category, "frequency": r.frequency,
            "streak_current": r.streak_current, "streak_best": r.streak_best,
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

pub async fn list_habits(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let rows: Vec<HabitRow> = sqlx::query_as(
        "SELECT id, name, category, frequency, streak_current, streak_best, is_active, created_at FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "name": r.name, "category": r.category, "frequency": r.frequency,
        "streak_current": r.streak_current, "streak_best": r.streak_best,
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}

#[derive(Deserialize)]
pub struct UpdateHabitRequest { pub name: Option<String>, pub category: Option<String> }

pub async fn update_habit(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(habit_id): Path<Uuid>, Json(req): Json<UpdateHabitRequest>) -> impl IntoResponse {
    sqlx::query("UPDATE habits SET name = COALESCE($1, name), category = COALESCE($2, category) WHERE id = $3 AND user_id = $4")
        .bind(&req.name).bind(&req.category).bind(habit_id).bind(auth.user_id)
        .execute(&pool).await.ok();
    (StatusCode::OK, Json(serde_json::json!({"message":"updated"}))).into_response()
}

pub async fn archive_habit(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(habit_id): Path<Uuid>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE habits SET is_active = false WHERE id = $1 AND user_id = $2")
        .bind(habit_id).bind(auth.user_id).execute(&pool).await;
    (StatusCode::NO_CONTENT, ()).into_response()
}

#[derive(Deserialize)]
pub struct MarkHabitRequest { pub completed: bool }

pub async fn mark_habit(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(habit_id): Path<Uuid>, Json(req): Json<MarkHabitRequest>) -> impl IntoResponse {
    if req.completed {
        let _ = sqlx::query("INSERT INTO habit_logs (habit_id, user_id, completed_at) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT (habit_id, completed_at) DO NOTHING")
            .bind(habit_id).bind(auth.user_id).execute(&pool).await;

        let yesterday_done: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM habit_logs WHERE habit_id = $1 AND completed_at = CURRENT_DATE - 1")
            .bind(habit_id).fetch_one(&pool).await.unwrap_or(0);

        let current_streak: i32 = sqlx::query_scalar("SELECT COALESCE(streak_current, 0) FROM habits WHERE id = $1")
            .bind(habit_id).fetch_one(&pool).await.unwrap_or(0);

        let new_streak = if yesterday_done > 0 { current_streak + 1 } else { 1 };

        let _ = sqlx::query("UPDATE habits SET streak_current = $1, streak_best = GREATEST(COALESCE(streak_best, 0), $1) WHERE id = $2 AND user_id = $3")
            .bind(new_streak).bind(habit_id).bind(auth.user_id).execute(&pool).await;

        (StatusCode::OK, Json(serde_json::json!({"streak": new_streak, "message": "habit logged"}))).into_response()
    } else {
        let _ = sqlx::query("DELETE FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND completed_at = CURRENT_DATE")
            .bind(habit_id).bind(auth.user_id).execute(&pool).await;

        let _ = sqlx::query("UPDATE habits SET streak_current = GREATEST(0, streak_current - 1) WHERE id = $1 AND user_id = $2")
            .bind(habit_id).bind(auth.user_id).execute(&pool).await;

        (StatusCode::OK, Json(serde_json::json!({"message": "habit log removed"}))).into_response()
    }
}

pub async fn today_habits(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow, Serialize)]
    struct TodayHabit { id: Uuid, name: String, category: Option<String>, frequency: Option<String>, streak_current: Option<i32>, completed_today: Option<bool> }

    let rows: Vec<TodayHabit> = sqlx::query_as(
        r#"SELECT h.id, h.name, h.category, h.frequency, h.streak_current,
              (SELECT COUNT(*) FROM habit_logs hl WHERE hl.habit_id = h.id AND hl.completed_at = CURRENT_DATE) > 0 AS completed_today
           FROM habits h WHERE h.user_id = $1 AND h.is_active = true ORDER BY h.created_at DESC"#
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "name": r.name, "category": r.category, "frequency": r.frequency,
        "streak_current": r.streak_current, "completed_today": r.completed_today.unwrap_or(false),
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}

pub async fn habit_history(auth: AuthUser, Extension(pool): Extension<PgPool>, Path(habit_id): Path<Uuid>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct LogRow { completed_at: chrono::NaiveDate }
    let rows: Vec<LogRow> = sqlx::query_as("SELECT completed_at FROM habit_logs WHERE habit_id = $1 AND user_id = $2 ORDER BY completed_at DESC LIMIT 90")
        .bind(habit_id).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let dates: Vec<_> = rows.iter().map(|r| r.completed_at.to_string()).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": dates}))).into_response()
}

pub async fn habit_suggestions(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let rows: Vec<String> = sqlx::query_scalar("SELECT name FROM habits WHERE user_id = $1 AND is_active = true LIMIT 10")
        .bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();
    
    let ctx = if rows.is_empty() { "None tracked yet".to_string() } else { rows.join(", ") };
    let prompt = format!("The user already tracks these habits: [{}]. Suggest 3 new, unique daily habits that complement them for mental health. Output ONLY a valid JSON array of objects with 'name', 'category', 'frequency' fields. Example: [{{\"name\":\"Read 10 pages\",\"category\":\"Mental\",\"frequency\":\"daily\"}}]", ctx);

    match openai::completion("You are a habit coach. Output pure JSON array of objects.", &prompt).await {
        Ok(resp) => {
            let parsed: serde_json::Value = serde_json::from_str(&resp).unwrap_or_else(|_| serde_json::json!([
                {"name": "Morning meditation", "category": "Mental", "frequency": "daily"}
            ]));
            (StatusCode::OK, Json(serde_json::json!({ "suggestions": parsed }))).into_response()
        }
        Err(e) => {
            tracing::error!("OpenAI error in habit_suggestions: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}
