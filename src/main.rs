// module declarations
mod cache;
mod middleware;
mod routes;
mod services;
mod models;

use anyhow::Context;
use dotenvy::dotenv;
use sqlx::{migrate::MigrateDatabase, PgPool};
use std::env;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .context("DATABASE_URL must be set in environment")?;

    // Ensure database exists (helpful for local dev)
    if !sqlx::Postgres::database_exists(&database_url).await? {
        println!("Database not found, creating...");
        sqlx::Postgres::create_database(&database_url).await?;
    }

    let pool = PgPool::connect(&database_url).await?;

    println!("Running SQL migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("Migrations applied.");

    // start server (Axum)
    crate::server::run(pool).await?;

    Ok(())
}

mod server;
