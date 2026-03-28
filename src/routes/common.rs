use axum::{response::IntoResponse, http::StatusCode, Json};
use serde_json::json;

pub fn not_implemented() -> (StatusCode, Json<serde_json::Value>) {
    (StatusCode::NOT_IMPLEMENTED, Json(json!({ "error": "not implemented" })))
}
