use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode, header},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,       // user_id as string
    pub org: Option<String>, // org_id as string
    pub role: String,      // "admin" | "member"
    pub exp: usize,
}

/// Axum extractor that validates the Bearer token and exposes user_id, org_id, role
pub struct AuthUser {
    pub user_id: Uuid,
    pub org_id: Option<Uuid>,
    pub role: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::MissingToken)?;

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".to_string());
        let key = DecodingKey::from_secret(secret.as_bytes());
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;

        let token_data = decode::<Claims>(token, &key, &validation)
            .map_err(|_| AuthError::InvalidToken)?;

        let claims = token_data.claims;

        let user_id = claims.sub.parse::<Uuid>()
            .map_err(|_| AuthError::InvalidToken)?;

        let org_id = claims.org
            .as_deref()
            .and_then(|s| s.parse::<Uuid>().ok());

        Ok(AuthUser { user_id, org_id, role: claims.role })
    }
}

/// Middleware helper: checks the caller has admin role within their org
pub fn require_admin(auth: &AuthUser) -> Result<(), AuthError> {
    if auth.role == "admin" {
        Ok(())
    } else {
        Err(AuthError::Forbidden)
    }
}

pub enum AuthError {
    MissingToken,
    InvalidToken,
    Forbidden,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid or expired token"),
            AuthError::Forbidden => (StatusCode::FORBIDDEN, "Admin access required"),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
