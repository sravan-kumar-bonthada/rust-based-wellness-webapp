use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct ChatSession {
    pub id: uuid::Uuid,
    pub user_id: Option<uuid::Uuid>,
    pub session_type: Option<String>,
    pub title: Option<String>,
    pub is_active: bool,
    pub message_count: i32,
    pub created_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    pub id: uuid::Uuid,
    pub session_id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub role: String,
    pub content: String,
    pub content_type: Option<String>,
    pub emotion_detected: Option<String>,
    pub tokens_used: Option<i32>,
    pub created_at: DateTime<Utc>,
}
