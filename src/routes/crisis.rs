use axum::{response::IntoResponse, Json, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::middleware::auth::AuthUser;
use crate::services::openai;

#[derive(Deserialize)]
pub struct DetectRequest { pub text: String }

#[derive(Serialize)]
pub struct DetectResponse {
    pub crisis_detected: bool,
    pub severity: String,
    pub intent: String,
    pub resources: serde_json::Value,
}

pub async fn detect(auth: AuthUser, Extension(pool): Extension<PgPool>, Json(req): Json<DetectRequest>) -> impl IntoResponse {
    let keywords = ["suicide", "kill myself", "end my life", "can't go on", "hopeless", "no point", "hurt myself", "cutting", "overdose"];
    let text_lower = req.text.to_lowercase();
    let keyword_match = keywords.iter().any(|kw| text_lower.contains(kw));

    let mut severity = "low".to_string();
    let mut intent = "none".to_string();
    let mut crisis_detected = false;

    if keyword_match || req.text.len() > 20 {
        // Use OpenAI for a deeper analysis
        let prompt = format!(
            "Analyze the following text for mental health crisis or self-harm intent: \"{}\". 
            Respond ONLY with a JSON object: {{\"detected\": bool, \"severity\": \"low|medium|high|critical\", \"intent\": \"string description\"}}",
            req.text
        );

        if let Ok(resp) = openai::completion("You are a crisis detection AI. Output pure JSON.", &prompt).await {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&resp) {
                crisis_detected = parsed["detected"].as_bool().unwrap_or(false);
                severity = parsed["severity"].as_str().unwrap_or("low").to_string();
                intent = parsed["intent"].as_str().unwrap_or("unknown").to_string();
            }
        }
    }

    // Default to keyword match if OpenAI fails but keyword was found
    if keyword_match && !crisis_detected {
        crisis_detected = true;
        severity = "medium".to_string();
    }

    if crisis_detected {
        let _ = sqlx::query("INSERT INTO crisis_events (user_id, severity, trigger_phrase) VALUES ($1, $2, $3)")
            .bind(auth.user_id).bind(&severity).bind(&req.text).execute(&pool).await;
        
        let resources = serde_json::json!({
            "lifeline": "988",
            "crisis_text": "Text HOME to 741741",
            "international": "https://www.befrienders.org/"
        });

        (StatusCode::OK, Json(DetectResponse {
            crisis_detected: true,
            severity,
            intent,
            resources,
        })).into_response()
    } else {
        (StatusCode::OK, Json(DetectResponse {
            crisis_detected: false,
            severity: "low".into(),
            intent: "none".into(),
            resources: serde_json::json!({}),
        })).into_response()
    }
}

pub async fn resources(_auth: AuthUser) -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({
        "resources": [
            {"name":"988 Suicide & Crisis Lifeline","type":"phone","contact":"988","availability":"24/7"},
            {"name":"Crisis Text Line","type":"text","contact":"Text HOME to 741741","availability":"24/7"},
        ],
        "grounding_exercises": [
            {"name":"Box Breathing","steps":["Inhale 4s","Hold 4s","Exhale 4s","Hold 4s"]},
            {"name":"5-4-3-2-1 Grounding","steps":["Name 5 things you see","Name 4 things to touch","Name 3 things you hear","Name 2 things you smell","Name 1 thing you taste"]},
        ]
    })))
}

pub async fn escalate(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    let _ = sqlx::query("INSERT INTO crisis_events (user_id, severity, escalated_to) VALUES ($1, 'critical', 'human_counselor')")
        .bind(auth.user_id).execute(&pool).await;
    (StatusCode::OK, Json(serde_json::json!({"message": "Situation flagged. Please call 988 immediately.", "hotline": "988"}))).into_response()
}

pub async fn history(auth: AuthUser, Extension(pool): Extension<PgPool>) -> impl IntoResponse {
    #[derive(sqlx::FromRow, Serialize)]
    struct CrisisRow { id: Uuid, severity: Option<String>, escalated_to: Option<String>, resolved: Option<bool>, created_at: DateTime<Utc> }

    let rows: Vec<CrisisRow> = sqlx::query_as(
        "SELECT id, severity, escalated_to, resolved, created_at FROM crisis_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10"
    ).bind(auth.user_id).fetch_all(&pool).await.unwrap_or_default();

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "severity": r.severity, "escalated_to": r.escalated_to, "resolved": r.resolved, "created_at": r.created_at,
    })).collect();
    (StatusCode::OK, Json(serde_json::json!({"data": data}))).into_response()
}
