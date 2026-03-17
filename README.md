# Volleyball Coach Training Planner

A collaborative web platform for volleyball coaches to create, share, and discover training sessions. Build drill libraries, design tactical diagrams on an interactive court canvas, and structure full training sessions — all in one place.

## Features

- **Drill library** — create and share drills with descriptions, focus area tags, skill level, age range, and player counts
- **Interactive drawing tool** — drag-and-drop players, arrows, cones, and zones onto a top-down volleyball court using Konva.js; export as PNG
- **Session planner** — compose ordered drill sequences with per-drill duration overrides and coach notes; export as PDF
- **Training modules** — reusable drill groups (warm-up, main, game, cool-down) that can be expanded into any session
- **Discovery** — browse and filter public drills, sessions, and modules by age range, skill level, and focus area
- **Social** — likes, favourites, comments, star ratings, coach following, and a personalised feed
- **Coaching mode** — full-screen one-drill-at-a-time view with a countdown timer for live sessions
- **Auth** — email/password registration; JWT stored in httpOnly cookies

## Tech Stack

| Layer        | Technology                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------ |
| Frontend     | React (Vite), Tailwind CSS, Zustand, React Query, React Hook Form + Zod, Konva.js, dnd-kit |
| Backend      | Python, FastAPI, SQLAlchemy (async), Alembic, PostgreSQL                                   |
| Auth         | JWT (access + refresh tokens), httpOnly cookies, bcrypt                                    |
| File storage | Local filesystem (dev) → AWS S3 (prod) via abstracted `StorageService`                     |
| Deployment   | Railway — single-service multi-stage Docker build                                          |
| CI           | GitHub Actions (lint on PR)                                                                |

## Local Development

**Prerequisites:** Docker and Docker Compose.

```bash
# 1. Clone
git clone https://github.com/<you>/volley-coach-planner
cd volley-coach-planner

# 2. Start all services (Postgres + backend + frontend)
docker compose up --build

# 3. First-time DB setup (run once after containers are up)
docker compose exec backend alembic upgrade head
```

The app is then available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

### Environment variables

The Docker Compose file sets sensible defaults for local development. For production, set these in your Railway project:

| Variable                | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (auto-injected by Railway plugin)    |
| `JWT_SECRET`            | Secret for access tokens                                          |
| `JWT_REFRESH_SECRET`    | Secret for refresh tokens                                         |
| `FRONTEND_URL`          | Allowed CORS origin (e.g. `https://yourapp.railway.app`)          |
| `AWS_ACCESS_KEY_ID`     | S3 credentials (optional — only needed when `STORAGE_BACKEND=s3`) |
| `AWS_SECRET_ACCESS_KEY` |                                                                   |
| `AWS_S3_BUCKET`         |                                                                   |
| `AWS_REGION`            |                                                                   |

### Running tests

```bash
# Frontend (Vitest + React Testing Library)
cd frontend && npm run test:run

# Backend (pytest)
cd backend && pytest tests/
```

## Project Structure

```
.
├── Dockerfile          # Multi-stage build: Node builds frontend → Python serves everything
├── docker-compose.yml  # Local dev: postgres + backend + frontend
├── railway.toml        # Railway deployment config
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, static mounts, SPA catch-all
│   │   ├── config.py       # Pydantic settings
│   │   ├── models/         # SQLAlchemy models (user, drill, session, comment, …)
│   │   ├── routers/        # API routers (auth, drills, sessions, users, …)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── storage.py      # StorageService ABC (LocalStorage / S3Storage)
│   │   └── dependencies.py # Auth dependencies
│   ├── alembic/            # DB migrations
│   ├── templates/          # Jinja2 HTML template for PDF export
│   ├── uploads/            # Local file storage (dev)
│   └── tests/
└── frontend/
    └── src/
        ├── components/     # UI, layout, drill, session, drawing, module components
        ├── pages/          # Route-level page components
        ├── hooks/          # React Query + auth hooks
        ├── store/          # Zustand stores (auth, drawing)
        └── lib/            # Axios instance, Zod schemas, constants
```

## Deployment (Railway)

The repo ships with a single-service multi-stage `Dockerfile` at the repo root. The Node stage builds the Vite frontend; the Python stage copies `dist/` into `frontend_dist/` and FastAPI serves it alongside the API from the same origin — no reverse proxy needed.

**One-time Railway setup:**

1. Create project → Deploy from GitHub (selects the root `Dockerfile` automatically via `railway.toml`)
2. Add the PostgreSQL plugin (auto-injects `DATABASE_URL`)
3. Add a Volume mounted at `/app/uploads`
4. Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`

## License

MIT — see [LICENSE](LICENSE).
