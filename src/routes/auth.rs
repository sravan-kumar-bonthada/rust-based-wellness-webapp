use axum::{Json, response::{IntoResponse, Redirect}, http::StatusCode, Extension, extract::{ConnectInfo, Query}};
use oauth2::{AuthorizationCode, TokenResponse};
use serde::Deserialize;
use sqlx::PgPool;
use std::net::SocketAddr;
use deadpool_redis::Pool as RedisPool;
use crate::middleware::rate_limiter;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

pub async fn login(
    Extension(pool): Extension<PgPool>,
    Extension(redis): Extension<RedisPool>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    let ip = addr.ip().to_string();
    let key = format!("rl:auth:ip:{}", ip);
    let allowed: bool = rate_limiter::check_rate_limit(&redis, &key, 10, 60).await.unwrap_or(false);
    if !allowed {
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": "rate limit exceeded" })));
    }

    match crate::services::auth::login_user(&pool, &req.email, &req.password).await {
        Ok((token, org_id, role)) => (StatusCode::OK, Json(serde_json::json!({
            "token": token,
            "org_id": org_id,
            "role": role,
        }))),
        Err(_e) => (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": "invalid credentials" }))),
    }
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub org_name: Option<String>,  // B2B: company name (creates an org + admin role)
}

pub async fn register(
    Extension(pool): Extension<PgPool>,
    Extension(redis): Extension<RedisPool>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<RegisterRequest>,
) -> impl IntoResponse {
    let ip = addr.ip().to_string();
    let key = format!("rl:auth:ip:{}", ip);
    let allowed: bool = rate_limiter::check_rate_limit(&redis, &key, 5, 60).await.unwrap_or(false);
    if !allowed {
        return (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({ "error": "rate limit exceeded" })));
    }

    match crate::services::auth::register_user(&pool, &req.email, &req.password, req.org_name.as_deref()).await {
        Ok(_user) => {
            match crate::services::auth::login_user(&pool, &req.email, &req.password).await {
                Ok((token, org_id, role)) => (StatusCode::CREATED, Json(serde_json::json!({
                    "token": token,
                    "org_id": org_id,
                    "role": role,
                }))),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "registration succeeded but token failed" }))),
            }
        }
        Err(e) => {
            tracing::warn!("register failed: {}", e);
            (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "could not register" })))
        }
    }
}

#[derive(Deserialize)]
pub struct AuthCallback {
    pub code: String,
    pub state: String,
}

pub async fn google_auth() -> impl IntoResponse {
    let client = match crate::services::sso::create_google_client() {
        Ok(c) => c,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "SSO Configuration missing").into_response(),
    };

    let (auth_url, _csrf_token) = client
        .authorize_url(oauth2::CsrfToken::new_random)
        .add_scope(oauth2::Scope::new("https://www.googleapis.com/auth/userinfo.email".to_string()))
        .add_scope(oauth2::Scope::new("https://www.googleapis.com/auth/userinfo.profile".to_string()))
        .url();

    Redirect::to(auth_url.as_str()).into_response()
}

pub async fn google_auth_callback(
    Extension(pool): Extension<PgPool>,
    Query(query): Query<AuthCallback>,
) -> impl IntoResponse {
    let client = match crate::services::sso::create_google_client() {
        Ok(c) => c,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "SSO Configuration missing").into_response(),
    };

    // Exchange the code for a token
    let token_result = client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(oauth2::reqwest::async_http_client)
        .await;

    let token = match token_result {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("OAuth token exchange failed: {:?}", e);
            return (StatusCode::BAD_REQUEST, "OAuth exchange failed").into_response();
        }
    };

    let access_token = token.access_token().secret();
    
    // Fetch user info from Google
    let google_user = match crate::services::sso::fetch_google_user(access_token).await {
        Ok(u) => u,
        Err(e) => {
            tracing::error!("Failed to fetch Google user info: {:?}", e);
            return (StatusCode::BAD_REQUEST, "Failed to fetch user info").into_response();
        }
    };

    // Find or create user and issue JWT
    match crate::services::auth::find_or_create_sso_user(&pool, &google_user.email, Some(&google_user.name)).await {
        Ok((token, org_id, role)) => {
            // In a real app, we'd redirect back to frontend with the token in a cookie or URL param
            // For this implementation, we'll redirect to a frontend callback page
            let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
            let redirect_url = format!(
                "{}/auth/callback?token={}&org_id={}&role={}", 
                frontend_url, 
                token, 
                org_id.map(|id| id.to_string()).unwrap_or_default(),
                role
            );
            Redirect::to(&redirect_url).into_response()
        },
        Err(e) => {
            tracing::error!("Failed to map SSO user: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "SSO Mapping failed").into_response()
        }
    }
}
