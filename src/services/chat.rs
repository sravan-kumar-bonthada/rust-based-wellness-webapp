use crate::models::chat::{ChatSession, Message};
use crate::services::openai;
use anyhow::Context;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_session(pool: &PgPool, user_id: Uuid, session_type: Option<&str>, title: Option<&str>) -> anyhow::Result<ChatSession> {
    let rec: ChatSession = sqlx::query_as::<_, ChatSession>(
        r#"INSERT INTO chat_sessions (user_id, session_type, title, is_active, message_count, created_at)
           VALUES ($1, $2, $3, true, 0, NOW())
           RETURNING id, user_id, session_type, title, is_active, message_count, created_at, ended_at"#,
    )
    .bind(user_id)
    .bind(session_type)
    .bind(title)
    .fetch_one(pool)
    .await
    .context("failed to insert chat session")?;
    Ok(rec)
}

pub async fn list_sessions(pool: &PgPool, user_id: Uuid) -> anyhow::Result<Vec<ChatSession>> {
    let rows: Vec<ChatSession> = sqlx::query_as::<_, ChatSession>(
        r#"SELECT id, user_id, session_type, title, is_active, message_count, created_at, ended_at
           FROM chat_sessions
           WHERE user_id = $1
           ORDER BY created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn get_session(pool: &PgPool, session_id: Uuid) -> anyhow::Result<ChatSession> {
    let rec: ChatSession = sqlx::query_as::<_, ChatSession>(
        r#"SELECT id, user_id, session_type, title, is_active, message_count, created_at, ended_at
           FROM chat_sessions
           WHERE id = $1"#,
    )
    .bind(session_id)
    .fetch_one(pool)
    .await
    .context("session not found")?;
    Ok(rec)
}

pub async fn delete_session(pool: &PgPool, session_id: Uuid) -> anyhow::Result<()> {
    sqlx::query("DELETE FROM chat_sessions WHERE id = $1")
        .bind(session_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub struct NewMessage {
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub role: String, // "user" or "assistant"
    pub content: String,
}

pub async fn add_message(pool: &PgPool, msg: NewMessage) -> anyhow::Result<Message> {
    let rec: Message = sqlx::query_as::<_, Message>(
        r#"INSERT INTO messages (session_id, user_id, role, content, created_at)
           VALUES ($1,$2,$3,$4,NOW())
           RETURNING id, session_id, user_id, role, content, content_type, emotion_detected, tokens_used, created_at"#,
    )
    .bind(msg.session_id)
    .bind(msg.user_id)
    .bind(msg.role)
    .bind(msg.content)
    .fetch_one(pool)
    .await?;

    // increment session count
    sqlx::query("UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = $1")
        .bind(msg.session_id)
        .execute(pool)
        .await?;

    Ok(rec)
}

pub async fn send_user_message(pool: &PgPool, session_id: Uuid, user_id: Uuid, content: &str) -> anyhow::Result<Message> {
    // 1. Get current session
    let session = get_session(pool, session_id).await?;
    tracing::info!("Processing message for session {} (count: {}, current title: {:?})", session_id, session.message_count, session.title);

    // 2. Add user message
    let _ = add_message(pool, NewMessage {
        session_id,
        user_id,
        role: "user".into(),
        content: content.to_string(),
    }).await?;

    // 3. Auto-title if it's the first message or still has default title
    let needs_title = session.message_count == 0 || session.title.as_deref().unwrap_or("").starts_with("New Session");
    
    if needs_title {
        tracing::info!("Auto-titling triggered for session {}", session_id);
        let first_msg_preview = if content.len() > 100 { &content[..100] } else { content };
        
        match openai::generate_title(first_msg_preview).await {
            Ok(title) => {
                let clean_title = title.trim().trim_matches('"').to_string();
                tracing::info!("Generated title for {}: '{}'", session_id, clean_title);
                
                match sqlx::query("UPDATE chat_sessions SET title = $1 WHERE id = $2")
                    .bind(&clean_title)
                    .bind(session_id)
                    .execute(pool)
                    .await {
                        Ok(_) => tracing::info!("Successfully updated title for {}", session_id),
                        Err(e) => tracing::error!("Database error updating title for {}: {}", session_id, e),
                    }
            },
            Err(e) => {
                tracing::error!("OpenAI error generating title for {}: {}", session_id, e);
            }
        }
    }

    // 4. Call OpenAI to get reply
    let ai_reply = openai::generate_reply(content).await?;

    // 5. Add assistant message
    let assistant_msg = add_message(pool, NewMessage {
        session_id,
        user_id,
        role: "assistant".into(),
        content: ai_reply.clone(),
    }).await?;

    Ok(assistant_msg)
}

pub async fn list_messages(pool: &PgPool, session_id: Uuid, limit: i64, offset: i64) -> anyhow::Result<Vec<Message>> {
    let msgs: Vec<Message> = sqlx::query_as::<_, Message>(
        r#"SELECT id, session_id, user_id, role, content, content_type, emotion_detected, tokens_used, created_at
           FROM messages
           WHERE session_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(session_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(msgs)
}

// real OpenAI integrations

pub async fn summarize_session(pool: &PgPool, session_id: Uuid) -> anyhow::Result<String> {
    // 1. Fetch recent messages
    let msgs: Vec<Message> = sqlx::query_as::<_, Message>(
        r#"SELECT id, session_id, user_id, role, content, content_type, emotion_detected, tokens_used, created_at
           FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 50"#
    ).bind(session_id).fetch_all(pool).await?;

    if msgs.is_empty() {
        return Ok("No messages to summarize.".into());
    }

    let transcript = msgs.iter()
        .map(|m| format!("{}: {}", m.role, m.content))
        .collect::<Vec<String>>()
        .join("\n");

    let prompt = format!("Summarize the following therapy chat session concisely in 3-4 sentences:\n\n{}", transcript);
    openai::completion("You are a helpful therapy assistant.", &prompt).await
}

pub async fn suggestions(pool: &PgPool, user_id: Uuid) -> anyhow::Result<Vec<String>> {
    // Basic context for suggestions
    let prompt = format!("Provide exactly 3 short, helpful, distinct conversation starter questions or therapeutic check-in questions a user might want to ask you (the AI therapist) next. Format them as a JSON array of strings. Example: [\"How do I manage my anxiety?\", \"Can we talk about my sleep?\", \"I'm feeling overwhelmed today.\"]. Only output the JSON array.");
    
    let resp = openai::completion("You are a helpful therapy assistant. Return pure JSON array of strings.", &prompt).await?;
    
    // Attempt to parse JSON array out of response
    let parsed: Vec<String> = serde_json::from_str(&resp).unwrap_or_else(|_| vec!["How are you feeling today?".to_string()]);
    Ok(parsed)
}

pub async fn export_session(pool: &PgPool, session_id: Uuid) -> anyhow::Result<String> {
    let msgs: Vec<Message> = sqlx::query_as::<_, Message>(
        r#"SELECT id, session_id, user_id, role, content, content_type, emotion_detected, tokens_used, created_at
           FROM messages WHERE session_id = $1 ORDER BY created_at ASC"#
    ).bind(session_id).fetch_all(pool).await?;

    let transcript = msgs.iter()
        .map(|m| format!("[{}] {}: {}", m.created_at.to_rfc3339(), m.role.to_uppercase(), m.content))
        .collect::<Vec<String>>()
        .join("\n\n");

    Ok(transcript)
}
