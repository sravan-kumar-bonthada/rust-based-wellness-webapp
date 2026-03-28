use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

pub async fn stats(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct PointsRow { total_points: Option<i32>, level: Option<i32>, badges: Option<Vec<String>>, weekly_streak: Option<i32> }

    let row: Result<PointsRow, _> = sqlx::query_as(
        "SELECT total_points, level, badges, weekly_streak FROM user_points WHERE user_id = $1"
    ).bind(auth.user_id).fetch_one(&pool).await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "total_points": r.total_points.unwrap_or(0), "level": r.level.unwrap_or(1),
            "badges": r.badges.unwrap_or_default(), "weekly_streak": r.weekly_streak.unwrap_or(0),
        }))).into_response(),
        Err(_) => (StatusCode::OK, Json(serde_json::json!({"total_points":0,"level":1,"badges":[],"weekly_streak":0}))).into_response(),
    }
}

pub async fn leaderboard(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct LeaderRow { display_name: Option<String>, avatar_url: Option<String>, total_points: Option<i32>, level: Option<i32>, weekly_streak: Option<i32> }

    // Scope leaderboard to org if user belongs to one; otherwise show personal only
    let rows: Vec<LeaderRow> = if let Some(org_id) = auth.org_id {
        sqlx::query_as(
            r#"SELECT u.display_name, u.avatar_url, p.total_points, p.level, p.weekly_streak
               FROM user_points p
               JOIN users u ON u.id = p.user_id
               WHERE u.org_id = $1
               ORDER BY p.total_points DESC LIMIT 50"#
        ).bind(org_id).fetch_all(&pool).await.unwrap_or_default()
    } else {
        sqlx::query_as(
            "SELECT u.display_name, u.avatar_url, p.total_points, p.level, p.weekly_streak FROM user_points p JOIN users u ON u.id = p.user_id WHERE u.id = $1"
        ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default()
    };

    let data: Vec<_> = rows.iter().enumerate().map(|(i, r)| serde_json::json!({
        "rank": i + 1,
        "display_name": r.display_name.clone().unwrap_or_else(|| "Anonymous".to_string()),
        "avatar_url": r.avatar_url,
        "total_points": r.total_points.unwrap_or(0),
        "level": r.level.unwrap_or(1),
        "weekly_streak": r.weekly_streak.unwrap_or(0),
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}


pub async fn badges(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let earned: Vec<String> = sqlx::query_scalar::<_, Option<Vec<String>>>("SELECT badges FROM user_points WHERE user_id = $1")
        .bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None).flatten().unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({
        "earned": earned,
        "all": [
            {"id":"first_mood","name":"First Mood","description":"Logged your first mood entry","icon":"😊"},
            {"id":"week_streak","name":"7-Day Streak","description":"7 consecutive days of habit completion","icon":"🔥"},
            {"id":"journal_5","name":"5 Journals","description":"Wrote 5 journal entries","icon":"📓"},
            {"id":"cbt_complete","name":"CBT Graduate","description":"Completed a CBT module","icon":"🧠"},
            {"id":"sleep_good","name":"Good Sleeper","description":"Logged 7+ hours for 3 nights","icon":"🌙"},
        ]
    }))).into_response()
}

pub async fn claim_reward(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let points: i32 = sqlx::query_scalar("SELECT total_points FROM user_points WHERE user_id = $1")
        .bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None).unwrap_or(0);

    if points < 100 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "Not enough points. Need 100."}))).into_response();
    }

    let _ = sqlx::query("UPDATE user_points SET total_points = total_points - 100, badges = array_append(COALESCE(badges, '{}'), 'reward_claimed') WHERE user_id = $1")
        .bind(auth.user_id).execute(&pool).await;

    (StatusCode::OK, Json(serde_json::json!({"message": "Reward claimed! 100 points deducted. New badge added."}))).into_response()
}
