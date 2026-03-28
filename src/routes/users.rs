use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Multipart};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;

#[derive(sqlx::FromRow, Serialize)]
struct UserRow {
    id: Uuid,
    email: String,
    display_name: Option<String>,
    avatar_url: Option<String>,
    bio: Option<String>,
    subscription: Option<String>,
    onboarding_done: Option<bool>,
    org_id: Option<Uuid>,
    role: String,
    created_at: Option<DateTime<Utc>>,
}

pub async fn get_me(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let row: Result<UserRow, _> = sqlx::query_as(
        "SELECT u.id, u.email, u.display_name, u.avatar_url, up.bio, u.subscription, u.onboarding_done, u.org_id, u.role, u.created_at 
         FROM users u 
         LEFT JOIN user_profiles up ON u.id = up.user_id 
         WHERE u.id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(&pool)
    .await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "id": r.id, 
            "email": r.email, 
            "display_name": r.display_name,
            "avatar_url": r.avatar_url, 
            "bio": r.bio,
            "subscription": r.subscription,
            "onboarding_done": r.onboarding_done, 
            "org_id": r.org_id,
            "role": r.role,
            "created_at": r.created_at,
        }))).into_response(),
        Err(e) => {
            println!("Error fetching user: {:?}", e);
            (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"user not found"}))).into_response()
        },
    }
}

#[derive(Deserialize)]
pub struct UpdateMeRequest { 
    pub display_name: Option<String>,
    pub bio: Option<String> 
}

pub async fn update_me(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<UpdateMeRequest>) -> impl IntoResponse {
    // Update users table
    let _ = sqlx::query("UPDATE users SET display_name = COALESCE($1, display_name), updated_at = NOW() WHERE id = $2")
        .bind(&req.display_name)
        .bind(auth.user_id)
        .execute(&pool)
        .await;

    // Update profiles table for bio
    let _ = sqlx::query(r#"INSERT INTO user_profiles (user_id, bio) VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET bio = COALESCE(EXCLUDED.bio, user_profiles.bio)"#)
        .bind(auth.user_id)
        .bind(&req.bio)
        .execute(&pool)
        .await;

    (StatusCode::OK, Json(serde_json::json!({"message":"profile updated"}))).into_response()
}

pub async fn delete_me(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let _ = sqlx::query("DELETE FROM users WHERE id = $1").bind(auth.user_id).execute(&pool).await;
    (StatusCode::NO_CONTENT, ()).into_response()
}

#[derive(sqlx::FromRow, Serialize)]
struct ProfileRow {
    anxiety_baseline: Option<i32>,
    depression_score: Option<i32>,
    primary_concerns: Option<Vec<String>>,
    therapy_goals: Option<Vec<String>>,
    timezone: Option<String>,
    mental_profile_completed: Option<bool>,
}

pub async fn get_mental_profile(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let row: Result<ProfileRow, _> = sqlx::query_as(
        "SELECT anxiety_baseline, depression_score, primary_concerns, therapy_goals, timezone, mental_profile_completed FROM user_profiles WHERE user_id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(&pool)
    .await;

    match row {
        Ok(r) => (StatusCode::OK, Json(serde_json::json!({
            "anxiety_baseline": r.anxiety_baseline, 
            "depression_score": r.depression_score,
            "primary_concerns": r.primary_concerns, 
            "therapy_goals": r.therapy_goals, 
            "timezone": r.timezone,
            "mental_profile_completed": r.mental_profile_completed,
        }))).into_response(),
        Err(_) => (StatusCode::OK, Json(serde_json::json!({}))).into_response(),
    }
}

#[derive(Deserialize)]
pub struct UpdateMentalProfile {
    pub anxiety_baseline: Option<i32>,
    pub depression_score: Option<i32>,
    pub primary_concerns: Option<Vec<String>>,
    pub therapy_goals: Option<Vec<String>>,
    pub timezone: Option<String>,
    pub mental_profile_completed: Option<bool>,
}

pub async fn update_mental_profile(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<UpdateMentalProfile>) -> impl IntoResponse {
    sqlx::query(r#"INSERT INTO user_profiles (user_id, anxiety_baseline, depression_score, primary_concerns, therapy_goals, timezone, mental_profile_completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE
           SET anxiety_baseline = COALESCE(EXCLUDED.anxiety_baseline, user_profiles.anxiety_baseline),
               depression_score = COALESCE(EXCLUDED.depression_score, user_profiles.depression_score),
               primary_concerns = COALESCE(EXCLUDED.primary_concerns, user_profiles.primary_concerns),
               therapy_goals = COALESCE(EXCLUDED.therapy_goals, user_profiles.therapy_goals),
               timezone = COALESCE(EXCLUDED.timezone, user_profiles.timezone),
               mental_profile_completed = COALESCE(EXCLUDED.mental_profile_completed, user_profiles.mental_profile_completed)"#)
        .bind(auth.user_id)
        .bind(req.anxiety_baseline)
        .bind(req.depression_score)
        .bind(req.primary_concerns)
        .bind(req.therapy_goals)
        .bind(req.timezone)
        .bind(req.mental_profile_completed)
        .execute(&pool)
        .await
        .ok();
    (StatusCode::OK, Json(serde_json::json!({"message":"profile updated"}))).into_response()
}

pub async fn upload_avatar(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" || name == "avatar" || true { // handle the first available file
            let file_name = field.file_name().unwrap_or("avatar.png").to_string();
            let ext = std::path::Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("png");
            let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
            let path = format!("uploads/{}", new_filename);
            
            if let Ok(data) = field.bytes().await {
                if !data.is_empty() {
                    if tokio::fs::write(&path, &data).await.is_ok() {
                        let avatar_url = format!("/{}", path);
                        
                        // update db
                        let _ = sqlx::query("UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2")
                            .bind(&avatar_url)
                            .bind(auth.user_id)
                            .execute(&pool)
                            .await;
                        
                        return (StatusCode::OK, Json(serde_json::json!({
                            "avatar_url": avatar_url,
                            "message": "Avatar uploaded successfully"
                        }))).into_response();
                    }
                }
            }
        }
    }

    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": "Failed to upload avatar"}))).into_response()
}

pub async fn dashboard_summary(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    // 1. Mood History (7 days)
    #[derive(sqlx::FromRow, Serialize)]
    struct MoodPoint { mood_score: i32, logged_at: DateTime<Utc> }
    let mood_history: Vec<MoodPoint> = sqlx::query_as(
        "SELECT mood_score, logged_at FROM mood_entries WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 7"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let latest_mood = mood_history.first();

    // 2. Habits
    let habits_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM habits WHERE user_id = $1 AND is_active = true")
        .bind(auth.user_id).fetch_one(&pool).await.unwrap_or(0);

    let habits_done: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id WHERE hl.user_id = $1 AND hl.completed_at = CURRENT_DATE"
    ).bind(auth.user_id).fetch_one(&pool).await.unwrap_or(0);

    let max_streak: i32 = sqlx::query_scalar("SELECT COALESCE(MAX(streak_current), 0) FROM habits WHERE user_id = $1")
        .bind(auth.user_id).fetch_one(&pool).await.unwrap_or(0);

    // 3. Sleep
    #[derive(sqlx::FromRow)]
    struct SleepRow { hours: Option<f64>, quality_score: Option<i32> }
    let sleep: Option<SleepRow> = sqlx::query_as(
        "SELECT EXTRACT(EPOCH FROM (wake_at - sleep_at))/3600 AS hours, quality_score FROM sleep_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1"
    ).bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None);

    // 4. Points & Community
    let points: i32 = sqlx::query_scalar("SELECT total_points FROM user_points WHERE user_id = $1")
        .bind(auth.user_id).fetch_optional(&pool).await.unwrap_or(None).unwrap_or(0);

    let community_new_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM community_posts WHERE created_at > NOW() - INTERVAL '24 hours'")
        .fetch_one(&pool).await.unwrap_or(0);

    // 5. Recommended Meditation
    let mut category_filter = "Morning";
    if let Some(m) = latest_mood {
        if m.mood_score <= 4 { category_filter = "Stress"; }
        else if m.mood_score <= 6 { category_filter = "Anxiety"; }
        else if m.mood_score <= 8 { category_filter = "Focus"; }
    }
    
    #[derive(sqlx::FromRow, Serialize)]
    struct RecMeditation { id: Uuid, title: String, duration_seconds: i32 }
    let recommendation: Option<RecMeditation> = sqlx::query_as(
        "SELECT id, title, duration_seconds FROM meditations WHERE category = $1 ORDER BY created_at DESC LIMIT 1"
    ).bind(category_filter).fetch_optional(&pool).await.unwrap_or(None);

    let user_name: String = sqlx::query_scalar("SELECT display_name FROM users WHERE id = $1")
        .bind(auth.user_id).fetch_one(&pool).await.unwrap_or_else(|_| "User".to_string());

    // B2B: Org context
    let org_name: Option<String> = if let Some(org_id) = auth.org_id {
        sqlx::query_scalar("SELECT name FROM organizations WHERE id = $1")
            .bind(org_id).fetch_optional(&pool).await.unwrap_or(None)
    } else { None };

    let team_size: i64 = if let Some(org_id) = auth.org_id {
        sqlx::query_scalar("SELECT COUNT(*) FROM org_members WHERE org_id = $1 AND status = 'active'")
            .bind(org_id).fetch_one(&pool).await.unwrap_or(0)
    } else { 1 };

    let mut ai_tip = "Track your mood and habits to get personalized insights!".to_string();
    
    if latest_mood.is_some() || habits_total > 0 {
        let ctx = format!(
            "Last mood: {:?}, Habits done today: {}/{}",
            latest_mood.map(|m| m.mood_score), habits_done, habits_total
        );
        let prompt = format!("Based on this employee wellness data: {}. Provide a 1-sentence supportive workplace wellbeing tip.", ctx);
        if let Ok(tip) = crate::services::openai::completion("You are a supportive corporate wellness coach.", &prompt).await {
            ai_tip = tip;
        }
    }

    (StatusCode::OK, Json(serde_json::json!({
        "user_name": user_name,
        "org_name": org_name,
        "org_role": auth.role,
        "team_size": team_size,
        "mood": {
            "latest": latest_mood.map(|m| m.mood_score),
            "history": mood_history
        },
        "habits": {"total": habits_total, "completed": habits_done, "max_streak": max_streak},
        "sleep": sleep.map(|s| serde_json::json!({"hours": s.hours, "quality": s.quality_score})),
        "points": points,
        "community": {"new_posts": community_new_posts},
        "recommendation": recommendation,
        "ai_tip": ai_tip,
    }))).into_response()
}


#[derive(Deserialize)]
pub struct UpdatePreferences { pub notification_prefs: Option<serde_json::Value> }

pub async fn update_preferences(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<UpdatePreferences>) -> impl IntoResponse {
    sqlx::query(r#"INSERT INTO user_profiles (user_id, notification_prefs) VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET notification_prefs = EXCLUDED.notification_prefs"#)
        .bind(auth.user_id)
        .bind(req.notification_prefs)
        .execute(&pool)
        .await
        .ok();
    (StatusCode::OK, Json(serde_json::json!({"message":"preferences updated"}))).into_response()
}
