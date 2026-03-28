use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::Serialize;
use sqlx::PgPool;

use crate::middleware::auth::{AuthUser, require_admin};

// ─── GET /api/v1/admin/analytics ──────────────────────────────────────────
/// Org-wide aggregate wellness analytics (admin only)
pub async fn analytics(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    // Active members
    let total_members: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM org_members WHERE org_id = $1 AND status = 'active'"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    // Avg mood (last 7 days across org)
    let avg_mood: Option<f64> = sqlx::query_scalar(
        r#"SELECT AVG(me.mood_score::float) FROM mood_entries me
           JOIN users u ON u.id = me.user_id
           WHERE u.org_id = $1 AND me.logged_at > NOW() - INTERVAL '7 days'"#
    ).bind(org_id).fetch_optional(&pool).await.unwrap_or(None);

    // Habit completion rate today
    let habits_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM habits h JOIN users u ON u.id = h.user_id WHERE u.org_id = $1 AND h.is_active = true"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    let habits_done_today: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*) FROM habit_logs hl
           JOIN habits h ON h.id = hl.habit_id
           JOIN users u ON u.id = h.user_id
           WHERE u.org_id = $1 AND hl.completed_at = CURRENT_DATE"#
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    let habit_completion_rate: f64 = if habits_total > 0 {
        (habits_done_today as f64 / habits_total as f64) * 100.0
    } else { 0.0 };

    // Avg sleep quality (last 7 days)
    let avg_sleep_hours: Option<f64> = sqlx::query_scalar(
        r#"SELECT AVG(EXTRACT(EPOCH FROM (se.wake_at - se.sleep_at))/3600)
           FROM sleep_entries se JOIN users u ON u.id = se.user_id
           WHERE u.org_id = $1 AND se.created_at > NOW() - INTERVAL '7 days'"#
    ).bind(org_id).fetch_optional(&pool).await.unwrap_or(None);

    // Daily Active Users (last 24h = users who sent a chat message or logged mood)
    let dau: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(DISTINCT u.id) FROM users u
           LEFT JOIN mood_entries me ON me.user_id = u.id AND me.logged_at > NOW() - INTERVAL '24 hours'
           LEFT JOIN messages msg ON msg.user_id = u.id AND msg.created_at > NOW() - INTERVAL '24 hours'
           WHERE u.org_id = $1 AND (me.id IS NOT NULL OR msg.id IS NOT NULL)"#
    ).bind(org_id).fetch_optional(&pool).await.unwrap_or(None).unwrap_or(0);

    let engagement_rate: f64 = if total_members > 0 {
        (dau as f64 / total_members as f64) * 100.0
    } else { 0.0 };

    // Mood trend: daily avg for last 14 days
    #[derive(sqlx::FromRow, Serialize)]
    struct MoodTrendPoint { day: String, avg_mood: f64 }
    let mood_trend: Vec<MoodTrendPoint> = sqlx::query_as(
        r#"SELECT TO_CHAR(me.logged_at::date, 'YYYY-MM-DD') AS day,
                  AVG(me.mood_score::float) AS avg_mood
           FROM mood_entries me JOIN users u ON u.id = me.user_id
           WHERE u.org_id = $1 AND me.logged_at > NOW() - INTERVAL '14 days'
           GROUP BY me.logged_at::date ORDER BY me.logged_at::date ASC"#
    ).bind(org_id).fetch_all(&pool).await.unwrap_or_default();

    // Crisis events in last 30 days
    let crisis_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*) FROM crisis_events ce JOIN users u ON u.id = ce.user_id
           WHERE u.org_id = $1 AND ce.created_at > NOW() - INTERVAL '30 days'"#
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    (StatusCode::OK, Json(serde_json::json!({
        "total_members": total_members,
        "daily_active_users": dau,
        "engagement_rate_pct": (engagement_rate * 10.0).round() / 10.0,
        "avg_mood_7d": avg_mood.map(|m| (m * 10.0).round() / 10.0),
        "habit_completion_rate_pct": (habit_completion_rate * 10.0).round() / 10.0,
        "avg_sleep_hours_7d": avg_sleep_hours.map(|h| (h * 10.0).round() / 10.0),
        "crisis_events_30d": crisis_count,
        "mood_trend": mood_trend,
    }))).into_response()
}

// ─── GET /api/v1/admin/members/wellness ────────────────────────────────────
/// Per-member wellness summary for HR (admin only)
pub async fn member_wellness(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    #[derive(sqlx::FromRow, Serialize)]
    struct MemberWellness {
        display_name: Option<String>,
        email: String,
        avg_mood: Option<f64>,
        habits_done_today: i64,
        last_active: Option<String>,
    }

    let rows: Vec<MemberWellness> = sqlx::query_as(
        r#"SELECT
             u.display_name,
             u.email,
             (SELECT AVG(me.mood_score::float) FROM mood_entries me WHERE me.user_id = u.id AND me.logged_at > NOW() - INTERVAL '7 days') AS avg_mood,
             (SELECT COUNT(*) FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id WHERE h.user_id = u.id AND hl.completed_at = CURRENT_DATE) AS habits_done_today,
             (SELECT TO_CHAR(MAX(me2.logged_at), 'YYYY-MM-DD') FROM mood_entries me2 WHERE me2.user_id = u.id) AS last_active
           FROM users u
           WHERE u.org_id = $1
           ORDER BY u.display_name ASC NULLS LAST"#
    ).bind(org_id).fetch_all(&pool).await.unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({"members": rows}))).into_response()
}

// ─── GET /api/v1/admin/engagement ─────────────────────────────────────────
pub async fn engagement(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    let chat_sessions_7d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM chat_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.org_id = $1 AND cs.created_at > NOW() - INTERVAL '7 days'"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    let journal_entries_7d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM journal_entries je JOIN users u ON u.id = je.user_id WHERE u.org_id = $1 AND je.created_at > NOW() - INTERVAL '7 days'"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    let mood_logs_7d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM mood_entries me JOIN users u ON u.id = me.user_id WHERE u.org_id = $1 AND me.logged_at > NOW() - INTERVAL '7 days'"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    (StatusCode::OK, Json(serde_json::json!({
        "chat_sessions_7d": chat_sessions_7d,
        "journal_entries_7d": journal_entries_7d,
        "mood_logs_7d": mood_logs_7d,
    }))).into_response()
}
