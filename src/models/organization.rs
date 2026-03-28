use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub subscription_plan: String,
    pub billing_email: Option<String>,
    pub max_seats: i32,
    pub logo_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrgMember {
    pub org_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub status: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct OrgInvite {
    pub id: Uuid,
    pub org_id: Uuid,
    pub email: String,
    pub invite_token: String,
    pub role: String,
    pub invited_by: Option<Uuid>,
    pub accepted: bool,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}
