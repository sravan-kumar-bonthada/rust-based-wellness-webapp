use serde::{Serialize, Deserialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CbtModule {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: Option<i32>,
    pub sort_order: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CbtStep {
    pub id: i32,
    pub module_id: String,
    pub step_order: i32,
    pub step_type: String, // "info" or "input"
    pub content: Option<String>,
    pub question: Option<String>,
    pub placeholder: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CbtSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub module_type: Option<String>,
    pub stage: Option<i32>,
    pub responses: Option<serde_json::Value>,
    pub completed: Option<bool>,
    pub score: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
}
