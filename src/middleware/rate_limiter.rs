use anyhow::Context;
use deadpool_redis::redis;
use deadpool_redis::redis::AsyncCommands;
use deadpool_redis::Pool;

/// Simple Lua token-bucket script: KEYS[1]=key, ARGV[1]=limit, ARGV[2]=ttl_seconds
const LUA_TOKEN_BUCKET: &str = r#"
local current = redis.call('get', KEYS[1])
if not current then
  redis.call('set', KEYS[1], 1, 'EX', ARGV[2])
  return 1
end
if tonumber(current) + 1 <= tonumber(ARGV[1]) then
  return redis.call('incr', KEYS[1])
end
return 0
"#;

pub async fn check_rate_limit(pool: &Pool, key: &str, limit: i64, window_seconds: usize) -> anyhow::Result<bool> {
    let mut conn = pool.get().await.context("failed to get redis conn")?;
    // EVAL the token bucket script
    let res: i64 = redis::cmd("EVAL")
        .arg(LUA_TOKEN_BUCKET)
        .arg(1)
        .arg(key)
        .arg(limit)
        .arg(window_seconds)
        .query_async::<_, i64>(&mut conn)
        .await
        .context("failed to eval token bucket script")?;

    Ok(res > 0)
}
