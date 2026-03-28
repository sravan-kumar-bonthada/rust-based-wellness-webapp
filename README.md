# MindfulAI - Backend (Axum + Postgres)

This repository contains the Axum-based backend for the MindfulAI project.

Local setup (macOS / Linux):

1. Start Postgres and Redis (see `docker-compose.dev.yml`):

```bash
docker compose -f docker-compose.dev.yml up -d
```

2. Copy `.env.example` to `.env` and adjust values.

3. Run migrations:

```bash
export DATABASE_URL=postgres://postgres:password@localhost:5432/mindfulai
psql "$DATABASE_URL" -f migrations/0001_create_schema.sql
# or use sqlx migrate if available
```

4. Run the server:

```bash
cargo run --bin ai-backend
```

Routes:
- `POST /api/v1/auth/register` - register + returns JWT
- `POST /api/v1/auth/login` - login + returns JWT
- `GET /health` - health check
