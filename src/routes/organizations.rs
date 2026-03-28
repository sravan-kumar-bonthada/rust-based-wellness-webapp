use axum::{response::IntoResponse, Json, http::StatusCode, Extension, extract::Path};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};

use crate::middleware::auth::{AuthUser, require_admin};

// ─── GET /api/v1/org/me ────────────────────────────────────────────────────
pub async fn get_org(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"not part of an organization"}))).into_response(),
    };

    #[derive(sqlx::FromRow, Serialize)]
    struct OrgRow {
        id: Uuid,
        name: String,
        slug: String,
        subscription_plan: String,
        billing_email: Option<String>,
        max_seats: i32,
        logo_url: Option<String>,
        created_at: DateTime<Utc>,
    }

    let seat_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM org_members WHERE org_id = $1 AND status = 'active'"
    ).bind(org_id).fetch_one(&pool).await.unwrap_or(0);

    match sqlx::query_as::<_, OrgRow>(
        "SELECT id, name, slug, subscription_plan, billing_email, max_seats, logo_url, created_at FROM organizations WHERE id = $1"
    ).bind(org_id).fetch_one(&pool).await {
        Ok(org) => (StatusCode::OK, Json(serde_json::json!({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "subscription_plan": org.subscription_plan,
            "billing_email": org.billing_email,
            "max_seats": org.max_seats,
            "seats_used": seat_count,
            "logo_url": org.logo_url,
            "created_at": org.created_at,
        }))).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"organization not found"}))).into_response(),
    }
}

// ─── PUT /api/v1/org/me ────────────────────────────────────────────────────
#[derive(Deserialize)]
pub struct UpdateOrgRequest {
    pub name: Option<String>,
    pub billing_email: Option<String>,
    pub logo_url: Option<String>,
}

pub async fn update_org(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<UpdateOrgRequest>) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    sqlx::query(
        "UPDATE organizations SET name = COALESCE($1, name), billing_email = COALESCE($2, billing_email), logo_url = COALESCE($3, logo_url), updated_at = NOW() WHERE id = $4"
    )
    .bind(&req.name).bind(&req.billing_email).bind(&req.logo_url).bind(org_id)
    .execute(&pool).await.ok();

    (StatusCode::OK, Json(serde_json::json!({"message":"organization updated"}))).into_response()
}

// ─── GET /api/v1/org/members ───────────────────────────────────────────────
pub async fn list_members(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    #[derive(sqlx::FromRow, Serialize)]
    struct MemberRow {
        user_id: Uuid,
        email: String,
        display_name: Option<String>,
        avatar_url: Option<String>,
        role: String,
        status: String,
        joined_at: DateTime<Utc>,
    }

    let members: Vec<MemberRow> = sqlx::query_as(
        r#"SELECT om.user_id, u.email, u.display_name, u.avatar_url, om.role, om.status, om.joined_at
           FROM org_members om
           JOIN users u ON u.id = om.user_id
           WHERE om.org_id = $1
           ORDER BY om.joined_at ASC"#
    ).bind(org_id).fetch_all(&pool).await.unwrap_or_default();

    (StatusCode::OK, Json(serde_json::json!({"members": members}))).into_response()
}

// ─── PUT /api/v1/org/members/:user_id/role ────────────────────────────────
#[derive(Deserialize)]
pub struct UpdateRoleRequest { pub role: String }

pub async fn update_member_role(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    Path(target_user_id): Path<Uuid>,
    Json(req): Json<UpdateRoleRequest>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    if req.role != "admin" && req.role != "member" {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"role must be admin or member"}))).into_response();
    }

    sqlx::query("UPDATE org_members SET role = $1 WHERE org_id = $2 AND user_id = $3")
        .bind(&req.role).bind(org_id).bind(target_user_id)
        .execute(&pool).await.ok();

    sqlx::query("UPDATE users SET role = $1 WHERE id = $2")
        .bind(&req.role).bind(target_user_id)
        .execute(&pool).await.ok();

    (StatusCode::OK, Json(serde_json::json!({"message":"role updated"}))).into_response()
}

// ─── DELETE /api/v1/org/members/:user_id ─────────────────────────────────
pub async fn remove_member(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    Path(target_user_id): Path<Uuid>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    sqlx::query("DELETE FROM org_members WHERE org_id = $1 AND user_id = $2")
        .bind(org_id).bind(target_user_id)
        .execute(&pool).await.ok();

    sqlx::query("UPDATE users SET org_id = NULL, role = 'member' WHERE id = $1")
        .bind(target_user_id)
        .execute(&pool).await.ok();

    (StatusCode::OK, Json(serde_json::json!({"message":"member removed"}))).into_response()
}

// ─── POST /api/v1/org/invite ───────────────────────────────────────────────
#[derive(Deserialize)]
pub struct InviteRequest {
    pub email: String,
    pub role: Option<String>,
}

pub async fn invite_member(
    auth: AuthUser,
    Extension(pool): Extension<PgPool>,
    Json(req): Json<InviteRequest>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&auth) { return e.into_response(); }
    let org_id = match auth.org_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json(serde_json::json!({"error":"no org"}))).into_response(),
    };

    let token: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(48)
        .map(char::from)
        .collect();

    let role = req.role.as_deref().unwrap_or("member");

    let invite_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO org_invites (org_id, email, invite_token, role, invited_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id"#
    )
    .bind(org_id).bind(&req.email).bind(&token).bind(role).bind(auth.user_id)
    .fetch_one(&pool).await
    .unwrap_or_else(|_| Uuid::new_v4());

    (StatusCode::CREATED, Json(serde_json::json!({
        "invite_id": invite_id,
        "invite_token": token,
        "invite_url": format!("/register?invite={}", token),
        "email": req.email,
        "role": role,
    }))).into_response()
}

// ─── POST /api/v1/org/invite/accept ────────────────────────────────────────
#[derive(Deserialize)]
pub struct AcceptInviteRequest {
    pub invite_token: String,
    pub email:        String,
    pub password:     String,
}

pub async fn accept_invite(
    Extension(pool): Extension<PgPool>,
    Json(req): Json<AcceptInviteRequest>,
) -> impl IntoResponse {
    #[derive(sqlx::FromRow)]
    struct InviteRow { id: Uuid, org_id: Uuid, role: String, accepted: bool }

    let invite: InviteRow = match sqlx::query_as(
        "SELECT id, org_id, role, accepted FROM org_invites WHERE invite_token = $1 AND email = $2 AND expires_at > NOW()"
    ).bind(&req.invite_token).bind(&req.email).fetch_one(&pool).await {
        Ok(i) => i,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"invalid or expired invite"}))).into_response(),
    };

    if invite.accepted {
        return (StatusCode::CONFLICT, Json(serde_json::json!({"error":"invite already used"}))).into_response();
    }

    // Register user (no org_name — they're joining an existing org)
    match crate::services::auth::register_user(&pool, &req.email, &req.password, None).await {
        Ok(user) => {
            // Link to the org
            let _ = sqlx::query(
                "UPDATE users SET org_id = $1, role = $2 WHERE id = $3"
            ).bind(invite.org_id).bind(&invite.role).bind(user.id).execute(&pool).await;

            let _ = sqlx::query(
                r#"INSERT INTO org_members (org_id, user_id, role, status) VALUES ($1, $2, $3, 'active') ON CONFLICT DO NOTHING"#
            ).bind(invite.org_id).bind(user.id).bind(&invite.role).execute(&pool).await;

            let _ = sqlx::query("UPDATE org_invites SET accepted = true WHERE id = $1")
                .bind(invite.id).execute(&pool).await;

            match crate::services::auth::login_user(&pool, &req.email, &req.password).await {
                Ok((token, org_id, role)) => (StatusCode::CREATED, Json(serde_json::json!({
                    "token": token, "org_id": org_id, "role": role,
                }))).into_response(),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"token issue"}))).into_response(),
            }
        }
        Err(e) => (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}
