use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::json;
use std::env;

/// Generalized function down to make calls to OpenAI's generic chat completions API
pub async fn completion(system_prompt: &str, user_prompt: &str) -> Result<String> {
    let api_key = env::var("OPENAI_API_KEY").context("OPENAI_API_KEY not set")?;
    let client = Client::new();

    let payload = json!({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    });

    let resp = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await
        .context("Failed to send request to OpenAI")?;

    if !resp.status().is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        anyhow::bail!("OpenAI API error: {}", err_text);
    }

    let json: serde_json::Value = resp.json().await.context("Failed to parse OpenAI JSON response")?;
    
    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .context("OpenAI response missing typical content field")?
        .to_string();

    Ok(content)
}

/// Generic text completion wrapper with Headspace-aligned prompt
pub async fn generate_reply(prompt: &str) -> Result<String> {
    completion(
        "You are 'Kind Mind', a warm, empathetic therapy companion. Your voice is gentle, non-judgmental, and encouraging—exactly like a Headspace guide. Use simple, mindful language and keep responses supportive and concise.", 
        prompt
    ).await
}

/// Generate a short (2-4 words) title for a conversation based on the first message
pub async fn generate_title(first_message: &str) -> Result<String> {
    let prompt = format!("Provide a very short, poetic title (max 4 words) for a mental health conversation that starts with: \"{}\". Return only the title text, no quotes or punctuation.", first_message);
    completion("You are a poetic creative assistant.", &prompt).await
}
