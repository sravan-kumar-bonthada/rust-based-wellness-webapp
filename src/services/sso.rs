use oauth2::basic::BasicClient;
use oauth2::{
    AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl,
};
use std::env;

pub fn create_google_client() -> anyhow::Result<BasicClient> {
    let client_id = env::var("GOOGLE_CLIENT_ID")
        .map(ClientId::new)
        .map_err(|_| anyhow::anyhow!("GOOGLE_CLIENT_ID not set"))?;
    let client_secret = env::var("GOOGLE_CLIENT_SECRET")
        .map(ClientSecret::new)
        .map_err(|_| anyhow::anyhow!("GOOGLE_CLIENT_SECRET not set"))?;

    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
        .map_err(|e| anyhow::anyhow!(e))?;
    let token_url = TokenUrl::new("https://www.googleapis.com/oauth2/v4/token".to_string())
        .map_err(|e| anyhow::anyhow!(e))?;

    let redirect_url = env::var("GOOGLE_REDIRECT_URL")
        .unwrap_or_else(|_| "http://localhost:8080/api/v1/auth/google/callback".to_string());

    Ok(BasicClient::new(
        client_id,
        Some(client_secret),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_url).map_err(|e| anyhow::anyhow!(e))?))
}

#[derive(serde::Deserialize)]
pub struct GoogleUser {
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

pub async fn fetch_google_user(token: &str) -> anyhow::Result<GoogleUser> {
    let client = reqwest::Client::new();
    let user_info = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .bearer_auth(token)
        .send()
        .await?
        .json::<GoogleUser>()
        .await?;

    Ok(user_info)
}
