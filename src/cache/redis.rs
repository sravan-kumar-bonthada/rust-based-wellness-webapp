use deadpool_redis::{Config as RedisConfig, Pool};

pub fn create_redis_pool(redis_url: &str) -> anyhow::Result<Pool> {
    let cfg = RedisConfig::from_url(redis_url);
    let pool = cfg.create_pool(None)?;
    Ok(pool)
}
