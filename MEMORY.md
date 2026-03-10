# Volleyball Coach Training Planner — Session Memory

## Project State: Phase 4 in progress (Railway deploy pending)

### Completed Features

- Auth (JWT, httpOnly cookies), register/login/logout/refresh
- Drill CRUD + list/filter/detail/edit pages
- Session CRUD + session builder (drill picker, drag-to-reorder, per-drill overrides, duplicate)
- Dashboard with tab navigation (sessions / drills), avatar upload
- PDF export: backend WeasyPrint endpoint + frontend download link
- File upload: avatars (`/api/users/me/avatar`) + drawing thumbnails (`/api/drills/{id}/drawing`)
- Drawing tool (Phase 3): FieldCanvas (Konva), IconPalette, DraggableIcon, DrawingToolbar, drawingStore (Zustand)
- Drawing tab integrated into DrillNew and DrillEdit (lazy loaded, with ErrorBoundary)
- Color scheme changed to red/black team colors (no more green elements: BEGINNER=gray, FUN=amber, toast success=white)
- Card.jsx forwards onClick prop (was missing — caused Explore drill click to not navigate)
- DrillDetail shows tactical diagram thumbnail (drawing_thumb_url) above description
- SessionDrillList shows thumbnail in both owner and read-only views
- PDF export already handles thumbnails via thumb_b64 in template
- Public profile pages (/profile/:userId) — shows coach info, public sessions + drills tabs
- Backend /api/drills + /api/sessions support ?author_id filter
- ErrorBoundary component at src/components/ui/ErrorBoundary.jsx
- useUserProfile hook at src/hooks/useUsers.js

### Color Scheme (RED & BLACK — team colors)

```
--color-bg:         #0d0d0d   (true black)
--color-surface:    #1a1a1a   (dark charcoal)
--color-surface-2:  #222222
--color-border:     #333333
--color-accent:     #cc1414   (team red)
--color-accent-2:   #ffffff   (white)
--color-text:       #f0f0f0
--color-text-muted: #888888
--color-danger:     #ff3333
--color-success:    #22cc44
```

### Architecture Key Points

- FastAPI + SQLAlchemy async + PostgreSQL via Docker Compose
- Axios baseURL = '' (empty) — Vite proxies /api/_ and /static/_ to backend
- JWT stored in httpOnly cookies (not localStorage)
- Passwords hashed with bcrypt directly (NOT passlib — incompatible with bcrypt>=4.0)
- Upload files saved to `./uploads/`, served at `/static/`
- PDF via WeasyPrint — requires apt packages in Dockerfile (libpango, libpangocairo, libcairo2, libgdk-pixbuf-xlib-2.0-0)
- Drawing: Konva Stage, icons stored as JSON in drill.drawing_json, thumbnail as PNG

### Routers registered in main.py

- auth, drills, sessions, users

### Drawing Tool Details

- Court: 760×460 stage, court area 680×340 (40,55 origin), red net line, white boundary
- Icon types: setter/libero/outside/middle/opposite/players 1-6/coach/ball/cone/zones/text
- Palette → drag onto canvas to place icons
- Click+drag on empty court → draws arrow
- Right-click icon → color picker + delete menu
- Text icons → right-click "Edit text" to rename
- Ctrl+Z / Ctrl+Y for undo/redo (max 50 history steps)
- Save Drawing button → POST multipart to /api/drills/{id}/drawing

### Railway Deployment (implemented, pending first push + manual setup)

- Root `Dockerfile`: multi-stage (node:20-alpine builds frontend, python:3.11-slim serves it)
- `rm -f package-lock.json` before `npm install` — macOS lock file missing linux-musl rollup binary
- `railway.toml`: healthcheck `/health`, timeout 300
- `backend/app/config.py`: added `frontend_dist_dir = "./frontend_dist"`
- `backend/app/main.py`: catch-all SPA route (only active when `frontend_dist/` dir exists, no local effect)
- Manual Railway steps: PostgreSQL plugin, Volume at `/app/uploads`, env vars JWT_SECRET + JWT_REFRESH_SECRET + FRONTEND_URL

### Security Fixes Applied (before Railway deploy)

- `secure=True` on auth cookies when `ENVIRONMENT=production` (was hardcoded `False`)
- Path traversal fix in SPA catch-all route (`os.path.realpath` + prefix check)
- Rate limiting via `slowapi` on `/api/auth/login` (5/min) and `/api/auth/register` (3/min)
- File size limit in `storage.py`: 10 MB default, 5 MB for avatars
- Avatar magic bytes validation (not just content-type header which is client-controlled)
- JWT secret validation at startup in production (raises ValueError if defaults not overridden)
- Security headers in production: HSTS, X-Content-Type-Options, X-Frame-Options
- OpenAPI docs disabled in production (`docs_url=None`, `redoc_url=None`)
- Limiter uses `X-Forwarded-For` in prod; unique UUID per request in test mode (TESTING=1 env var)

### Unit Tests Added

- `backend/pytest.ini` — asyncio_mode = auto
- `backend/tests/conftest.py` — session-scoped engine (creates/drops tables), function-scoped client with no-commit session override for clean test isolation
- `backend/tests/test_security.py` — pure unit tests for hashing + JWT
- `backend/tests/test_auth.py` — register, login, logout, refresh, me
- `backend/tests/test_drills.py` — CRUD + authorization + likes
- `backend/tests/test_sessions.py` — CRUD + drill management + authorization
- `backend/tests/test_users.py` — profile, avatar upload + magic bytes validation

**To run tests:**

```bash
docker compose exec postgres psql -U volleycoach -c "CREATE DATABASE volleycoach_test;"
cd backend && TESTING=1 pytest -v
```

### Still TODO

- Mobile responsive improvements
- Add author links from DrillDetail/SessionDetail sidebar → /profile/:userId (user_id is on DrillOut/SessionOut but author name is not — would need backend change or separate fetch)
