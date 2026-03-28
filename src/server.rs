use axum::{routing::{get, post}, Router, Extension, Json, response::IntoResponse, http::{StatusCode, HeaderName, Method}};
use serde::Serialize;
use sqlx::PgPool;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use crate::cache::redis::create_redis_pool;
use deadpool_redis::Pool as RedisPool;

pub async fn run(pool: PgPool) -> anyhow::Result<()> {
    // init tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .try_init()
        .ok();

    // create redis pool
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
    let redis_pool: RedisPool = create_redis_pool(&redis_url)?;

    // Ensure uploads directory exists
    tokio::fs::create_dir_all("uploads").await.unwrap_or_else(|_| {
        tracing::warn!("Failed to create uploads directory");
    });

    let app = Router::new()
        .route("/health", get(health))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .nest(
            "/api/v1/auth",
            Router::new()
                .route("/login", post(crate::routes::auth::login))
                .route("/register", post(crate::routes::auth::register))
                .route("/google", get(crate::routes::auth::google_auth))
                .route("/google/callback", get(crate::routes::auth::google_auth_callback)),
        )
        .nest(
            "/api/v1/users",
            Router::new()
                .route("/me", get(crate::routes::users::get_me))
                .route("/me", axum::routing::put(crate::routes::users::update_me))
                .route("/me", axum::routing::delete(crate::routes::users::delete_me))
                .route("/me/mental-profile", get(crate::routes::users::get_mental_profile))
                .route("/me/mental-profile", axum::routing::put(crate::routes::users::update_mental_profile))
                .route("/me/avatar", post(crate::routes::users::upload_avatar))
                .route("/me/dashboard-summary", get(crate::routes::users::dashboard_summary))
                .route("/me/preferences", axum::routing::put(crate::routes::users::update_preferences)),
        )
        .nest(
            "/api/v1/chat",
            Router::new()
                .route("/sessions", axum::routing::post(crate::routes::chat::create_session))
                .route("/sessions", get(crate::routes::chat::list_sessions))
                .route("/sessions/:id", get(crate::routes::chat::get_session))
                .route("/sessions/:id", axum::routing::delete(crate::routes::chat::delete_session))
                .route("/sessions/:id/messages", axum::routing::post(crate::routes::chat::send_message))
                .route("/sessions/:id/messages", get(crate::routes::chat::list_messages))
                .route("/voice-to-text", axum::routing::post(crate::routes::chat::voice_to_text))
                .route("/sessions/:id/summarize", axum::routing::post(crate::routes::chat::summarize_session))
                .route("/suggestions", get(crate::routes::chat::suggestions))
                .route("/sessions/:id/export", axum::routing::post(crate::routes::chat::export_session)),
        )
        .nest(
            "/api/v1/cbt",
            Router::new()
                .route("/modules", get(crate::routes::cbt::list_modules))
                .route("/modules/:id", get(crate::routes::cbt::get_module))
                .route("/sessions", axum::routing::post(crate::routes::cbt::start_session))
                .route("/sessions", get(crate::routes::cbt::list_cbt_sessions))
                .route("/sessions/:id", get(crate::routes::cbt::get_cbt_session))
                .route("/sessions/:id/respond", axum::routing::post(crate::routes::cbt::respond_step))
                .route("/sessions/:id/complete", axum::routing::post(crate::routes::cbt::complete_session))
                .route("/thought-records", get(crate::routes::cbt::list_thought_records))
                .route("/thought-records", axum::routing::post(crate::routes::cbt::create_thought_record))
                .route("/behavioral-activation", get(crate::routes::cbt::get_behavioral_tasks)),
        )
        .nest(
            "/api/v1/mood",
            Router::new()
                .route("/", axum::routing::post(crate::routes::mood::create_mood))
                .route("/", get(crate::routes::mood::list_mood))
                .route("/today", get(crate::routes::mood::today_mood))
                .route("/:id", axum::routing::put(crate::routes::mood::update_mood))
                .route("/analytics", get(crate::routes::mood::analytics))
                .route("/predictions", get(crate::routes::mood::predictions)),
        )
        .nest(
            "/api/v1/journal",
            Router::new()
                .route("/", axum::routing::post(crate::routes::journal::create_entry))
                .route("/", get(crate::routes::journal::list_entries))
                .route("/:id", get(crate::routes::journal::get_entry))
                .route("/:id", axum::routing::put(crate::routes::journal::update_entry))
                .route("/:id", axum::routing::delete(crate::routes::journal::delete_entry))
                .route("/insights", get(crate::routes::journal::insights)),
        )
        .nest(
            "/api/v1/habits",
            Router::new()
                .route("/", axum::routing::post(crate::routes::habits::create_habit))
                .route("/", get(crate::routes::habits::list_habits))
                .route("/:id", axum::routing::put(crate::routes::habits::update_habit))
                .route("/:id", axum::routing::delete(crate::routes::habits::archive_habit))
                .route("/:id/log", axum::routing::post(crate::routes::habits::mark_habit))
                .route("/today", get(crate::routes::habits::today_habits))
                .route("/:id/history", get(crate::routes::habits::habit_history))
                .route("/suggestions", get(crate::routes::habits::habit_suggestions)),
        )
        .nest(
            "/api/v1/sleep",
            Router::new()
                .route("/", axum::routing::post(crate::routes::sleep::create_sleep))
                .route("/", get(crate::routes::sleep::list_sleep))
                .route("/analytics", get(crate::routes::sleep::sleep_analytics))
                .route("/ai-suggestions", get(crate::routes::sleep::sleep_suggestions)),
        )
        .nest(
            "/api/v1/gamification",
            Router::new()
                .route("/stats", get(crate::routes::gamification::stats))
                .route("/leaderboard", get(crate::routes::gamification::leaderboard))
                .route("/badges", get(crate::routes::gamification::badges))
                .route("/claim-reward", axum::routing::post(crate::routes::gamification::claim_reward)),
        )
        .nest(
            "/api/v1/community",
            Router::new()
                .route("/posts", get(crate::routes::community::list_posts))
                .route("/posts", axum::routing::post(crate::routes::community::create_post)),
        )
        .nest(
            "/api/v1/meditations",
            Router::new()
                .route("/", get(crate::routes::meditations::list_meditations)),
        )
        .nest(
            "/api/v1/resources",
            Router::new()
                .route("/", get(crate::routes::resources::list_resources)),
        )
        .nest(
            "/api/v1/crisis",
            Router::new()
                .route("/detect", axum::routing::post(crate::routes::crisis::detect))
                .route("/resources", get(crate::routes::crisis::resources))
                .route("/escalate", axum::routing::post(crate::routes::crisis::escalate))
                .route("/history", get(crate::routes::crisis::history)),
        )
        .nest(
            "/api/v1/notifications",
            Router::new()
                .route("/", get(crate::routes::notifications::list_notifications))
                .route("/:id/read", axum::routing::put(crate::routes::notifications::mark_read))
                .route("/read-all", axum::routing::put(crate::routes::notifications::mark_read_all))
                .route("/preferences", axum::routing::put(crate::routes::notifications::update_preferences)),
        )
        // ── B2B: Organization Management ────────────────────────────────
        .nest(
            "/api/v1/org",
            Router::new()
                .route("/me", get(crate::routes::organizations::get_org))
                .route("/me", axum::routing::put(crate::routes::organizations::update_org))
                .route("/members", get(crate::routes::organizations::list_members))
                .route("/members/:user_id/role", axum::routing::put(crate::routes::organizations::update_member_role))
                .route("/members/:user_id", axum::routing::delete(crate::routes::organizations::remove_member))
                .route("/invite", axum::routing::post(crate::routes::organizations::invite_member))
                .route("/invite/accept", axum::routing::post(crate::routes::organizations::accept_invite)),
        )
        // ── B2B: Admin Analytics ─────────────────────────────────────────
        .nest(
            "/api/v1/admin",
            Router::new()
                .route("/analytics", get(crate::routes::admin::analytics))
                .route("/members/wellness", get(crate::routes::admin::member_wellness))
                .route("/engagement", get(crate::routes::admin::engagement)),
        )
        .layer(Extension(pool))
        .layer(Extension(redis_pool))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        );

    let bind_addr = std::env::var("SERVER_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string());

    tracing::info!("listening on {}", bind_addr);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn health() -> impl IntoResponse {
    #[derive(Serialize)]
    struct H { status: &'static str }
    (StatusCode::OK, Json(H { status: "ok" }))
}

async fn shutdown_signal() {
    // Ctrl+C
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("shutdown signal received");
}
