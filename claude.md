# Volleyball Coach Training Planner — CLAUDE.md

## Project Overview

A collaborative web platform for volleyball coaches to create, share, and discover training sessions. Coaches can build drill libraries, tag sessions by age/skill level, and design tactical drawings using drag-and-drop icons on an interactive volleyball field.

---

## Tech Stack

### Frontend

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS + custom CSS variables
- **State Management**: Zustand (global store) + React Query (server state)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` (for drill ordering) and native HTML5 drag-and-drop for the field canvas
- **Canvas / Drawing**: Konva.js (`react-konva`) for the volleyball field drawing tool
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

### Backend

- **Runtime**: Python — FastAPI
- **ORM**: SQLAlchemy + Alembic (migrations)
- **Database**: PostgreSQL (self-hosted via Docker Compose)
- **Auth**: JWT-based authentication (access + refresh tokens) stored in httpOnly cookies; email/password only — designed to add OAuth (Google) later
- **File Storage**: Local filesystem (`uploads/`) for development → AWS S3 for production (storage layer abstracted behind a simple interface to make migration easy)
- **API**: RESTful JSON API

### DevOps / Infrastructure

- **Containerization**: Docker + Docker Compose (`postgres`, `backend`, `frontend`)
- **Deployment**: Railway (Git-push deploys, free tier, handles FastAPI + Postgres well)
- **CI**: GitHub Actions (lint on PR; tests deferred until post-MVP)

---

## Core Features

### 1. Authentication & User Profiles

- Register / Login / Logout
- JWT stored in httpOnly cookies (not localStorage)
- User profile: name, club, country, coaching level (C, B, A license)
- Avatar upload
- Public profile page showing all published sessions by that coach

### 2. Drill Library

A drill is the atomic unit — a single exercise or activity.

**Drill fields:**
| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | text | markdown supported |
| `duration_minutes` | int | estimated duration |
| `num_players_min` | int | |
| `num_players_max` | int | |
| `equipment` | string[] | e.g. ["balls", "cones", "net"] |
| `skill_tags` | string[] | see tag taxonomy below |
| `age_range` | enum | U12, U14, U16, U18, Adults, All |
| `skill_level` | enum | Beginner, Intermediate, Advanced, Elite |
| `focus_area` | enum | Serving, Reception, Setting, Attack, Block, Defense, Tactics, Fitness, Fun |
| `drawing` | JSON | serialized Konva stage (optional) |
| `drawing_thumbnail` | url | PNG export of drawing |
| `video_url` | string | optional YouTube/Vimeo embed |
| `created_by` | userId | |
| `is_public` | bool | published vs draft |
| `likes` | int | |
| `created_at` | datetime | |

### 3. Training Session Planner

A session groups multiple drills into a structured training unit.

**Session fields:**
| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `description` | text | |
| `total_duration_minutes` | int | auto-calculated from drills |
| `age_range` | enum | same taxonomy as drills |
| `skill_level` | enum | |
| `focus_areas` | string[] | multi-select |
| `team_size` | int | |
| `drills` | DrillSession[] | ordered list with per-drill notes |
| `is_public` | bool | |
| `tags` | string[] | free-form extra tags |
| `likes` | int | |
| `created_by` | userId | |

**DrillSession (junction):**

```
{
  drill_id,
  order_index,      // drag to reorder
  duration_override, // override default duration
  coach_notes       // session-specific notes for this drill
}
```

### 4. Field Drawing Tool

The most unique feature — an interactive volleyball court canvas where coaches draw tactical diagrams.

**Canvas features:**

- Full volleyball court rendered as SVG background (top-down view)
- Drag-and-drop icon palette onto the court
- Icons include:
  - Players: Setter (S), Libero (L), Outside (OH), Middle (MB), Opposite (OPP), Generic player (P1–P6)
  - Ball
  - Cone
  - Movement arrows (straight, curved, dashed)
  - Attack lines, serve trajectories
  - Zone labels (1–6 rotation zones)
- Each icon is movable, resizable, rotatable after placement
- Text labels can be added anywhere
- Multiple layers (e.g., "Phase 1", "Phase 2") — coaches can animate phases
- Export as PNG (saved as drill thumbnail)
- Save as JSON (stored in `drawing` field, reloadable)
- Undo/redo (Ctrl+Z / Ctrl+Y)
- Color picker per icon/arrow

**Technical approach (react-konva):**

```jsx
// Core structure
<Stage width={800} height={600}>
  <Layer name="court-background">
    {/* SVG court lines rendered as Konva shapes */}
  </Layer>
  <Layer name="icons">
    {icons.map((icon) => (
      <DraggableIcon key={icon.id} {...icon} />
    ))}
  </Layer>
  <Layer name="arrows">
    {arrows.map((arrow) => (
      <DraggableArrow key={arrow.id} {...arrow} />
    ))}
  </Layer>
</Stage>
```

---

## Database Schema (PostgreSQL / SQLAlchemy)

> Schema is defined via SQLAlchemy models; Alembic handles migrations. The Prisma schema below is kept as a reference for the data model — the actual implementation uses Python models.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  club          String?
  country       String?
  coachingLevel String?   // C, B, A, national
  avatarUrl     String?
  drills        Drill[]
  sessions      Session[]
  likes         Like[]
  createdAt     DateTime  @default(now())
}

model Drill {
  id               String         @id @default(cuid())
  title            String
  description      String
  durationMinutes  Int
  numPlayersMin    Int?
  numPlayersMax    Int?
  equipment        String[]
  skillTags        String[]
  ageRange         AgeRange
  skillLevel       SkillLevel
  focusArea        FocusArea
  drawingJson      Json?
  drawingThumbUrl  String?
  videoUrl         String?
  isPublic         Boolean        @default(false)
  createdBy        User           @relation(fields: [userId], references: [id])
  userId           String
  sessions         DrillSession[]
  likes            Like[]
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

model Session {
  id              String         @id @default(cuid())
  title           String
  description     String
  ageRange        AgeRange
  skillLevel      SkillLevel
  focusAreas      String[]
  teamSize        Int?
  isPublic        Boolean        @default(false)
  tags            String[]
  drills          DrillSession[]
  createdBy       User           @relation(fields: [userId], references: [id])
  userId          String
  likes           Like[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model DrillSession {
  id               String   @id @default(cuid())
  drill            Drill    @relation(fields: [drillId], references: [id])
  drillId          String
  session          Session  @relation(fields: [sessionId], references: [id])
  sessionId        String
  orderIndex       Int
  durationOverride Int?
  coachNotes       String?
}

model Like {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  drillId   String?
  sessionId String?
  createdAt DateTime @default(now())
}

enum AgeRange {
  U12
  U14
  U16
  U18
  ADULTS
  ALL
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  ELITE
}

enum FocusArea {
  SERVING
  RECEPTION
  SETTING
  ATTACK
  BLOCK
  DEFENSE
  TACTICS
  FITNESS
  FUN
  WARMUP
}
```

---

## API Endpoints

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Users

```
GET    /api/users/:id             — public profile
PATCH  /api/users/me              — update own profile
POST   /api/users/me/avatar       — upload avatar
```

### Drills

```
GET    /api/drills                — list (public, with filters)
POST   /api/drills                — create (auth required)
GET    /api/drills/:id            — get single
PATCH  /api/drills/:id            — update (owner only)
DELETE /api/drills/:id            — delete (owner only)
POST   /api/drills/:id/like       — toggle like
POST   /api/drills/:id/drawing    — save drawing JSON + generate thumbnail
GET    /api/drills/mine           — own drills (auth)
```

### Sessions

```
GET    /api/sessions              — list (public, with filters)
POST   /api/sessions              — create (auth required)
GET    /api/sessions/:id          — get single with full drill list
PATCH  /api/sessions/:id          — update (owner only)
DELETE /api/sessions/:id          — delete (owner only)
POST   /api/sessions/:id/like     — toggle like
POST   /api/sessions/:id/drills   — add drill to session
PATCH  /api/sessions/:id/drills   — reorder drills
DELETE /api/sessions/:id/drills/:drillId — remove drill
GET    /api/sessions/mine         — own sessions (auth)
```

### Query Parameters (for list endpoints)

```
?ageRange=U16,ADULTS
?skillLevel=INTERMEDIATE
?focusArea=ATTACK,RECEPTION
?search=back+row
?sortBy=createdAt|likes|duration
?page=1&limit=20
?authorId=<userId>
```

---

## Frontend Pages & Routes

```
/                        — Landing / home feed (public sessions + drills)
/login                   — Login page
/register                — Register page
/explore                 — Browse all public content (tabbed: Sessions | Drills)
/explore/sessions        — Session browser with filters
/explore/drills          — Drill browser with filters
/sessions/new            — Create new session
/sessions/:id            — View session detail
/sessions/:id/edit       — Edit session
/drills/new              — Create new drill (includes drawing tool)
/drills/:id              — View drill detail
/drills/:id/edit         — Edit drill
/profile/:userId         — Public coach profile
/me                      — Own dashboard (my sessions, my drills, liked)
/me/settings             — Account settings
```

---

## Component Architecture

```
src/
├── components/
│   ├── ui/               # Generic: Button, Input, Badge, Modal, Tabs, Card
│   ├── layout/           # Navbar, Sidebar, PageWrapper, Footer
│   ├── drill/
│   │   ├── DrillCard.jsx
│   │   ├── DrillForm.jsx
│   │   ├── DrillFilters.jsx
│   │   └── DrillDetail.jsx
│   ├── session/
│   │   ├── SessionCard.jsx
│   │   ├── SessionForm.jsx
│   │   ├── SessionDrillList.jsx   # Drag-to-reorder drills in session
│   │   └── SessionDetail.jsx
│   ├── drawing/
│   │   ├── FieldCanvas.jsx        # Main Konva stage
│   │   ├── IconPalette.jsx        # Sidebar of draggable icons
│   │   ├── DraggableIcon.jsx      # Single icon on canvas
│   │   ├── ArrowTool.jsx          # Arrow drawing tool
│   │   ├── LayerManager.jsx       # Phase layers panel
│   │   └── DrawingToolbar.jsx     # Undo, redo, export, color picker
│   └── common/
│       ├── TagBadge.jsx
│       ├── SkillLevelBadge.jsx
│       ├── AgeRangeBadge.jsx
│       └── LikeButton.jsx
├── pages/
│   ├── Home.jsx
│   ├── Explore.jsx
│   ├── DrillNew.jsx
│   ├── DrillDetail.jsx
│   ├── SessionNew.jsx
│   ├── SessionDetail.jsx
│   ├── Profile.jsx
│   └── Dashboard.jsx
├── store/
│   ├── authStore.js       # Zustand: current user, token
│   └── drawingStore.js    # Zustand: canvas state, undo/redo history
├── hooks/
│   ├── useAuth.js
│   ├── useDrills.js       # React Query hooks
│   ├── useSessions.js
│   └── useDrawing.js
├── lib/
│   ├── api.js             # Axios instance with interceptors
│   ├── validation.js      # Zod schemas
│   └── constants.js       # Tag taxonomies, enums
└── assets/
    └── court-svg/         # SVG volleyball court assets
```

---

## Drawing Tool — Detailed Spec

### Icon Palette Categories

**Players**

- Setter (S) — yellow circle
- Libero (L) — red circle
- Outside Hitter (OH) — blue circle
- Middle Blocker (MB) — green circle
- Opposite (OPP) — orange circle
- Generic P1–P6 — grey circles with numbers
- Coach — star shape

**Objects**

- Volleyball — circle with stitch pattern
- Cone — triangle
- Antenna — thin vertical line

**Arrows / Movements**

- Straight move arrow
- Curved move arrow
- Dashed line (ball trajectory)
- Zigzag (shuffle movement)
- Double-headed arrow

**Zones & Labels**

- Zone markers 1–6
- Free text label
- Rectangle zone highlight

### Canvas Behavior

1. **Drag from palette → drop on court**: creates a new icon at drop position
2. **Click icon**: selects it, shows transform handles
3. **Drag selected icon**: moves it
4. **Scroll on icon**: resizes it
5. **Right-click icon**: context menu (duplicate, delete, change color, add label)
6. **Click + drag on empty court**: creates a movement arrow
7. **Double-click arrow midpoint**: adds a bend point (Bezier curve)

### Undo/Redo

Store history as an array of serialized stage snapshots (max 50 steps):

```js
const { past, present, future } = drawingStore;
// Ctrl+Z: pop from past, push present to future
// Ctrl+Y: pop from future, push present to past
```

### Export

- **PNG export**: `stage.toDataURL({ mimeType: 'image/png', pixelRatio: 2 })`
- **JSON save**: `stage.toJSON()` → store in `drill.drawingJson`
- **PDF export** (optional): use `jsPDF` + canvas image

---

## Design System

### Visual Direction

Sports-professional with a modern coach's notebook aesthetic. Think tactical chalkboard meets clean digital dashboard. Dark navy primary tones with sharp yellow-green accents (volleyball colors). Clean, high-contrast typography.

### Color Palette

```css
:root {
  --color-bg: #0f1117; /* Near-black navy */
  --color-surface: #1a1f2e; /* Card background */
  --color-surface-2: #242938; /* Elevated surface */
  --color-border: #2e3548; /* Subtle borders */
  --color-accent: #c8f135; /* Volleyball yellow-green */
  --color-accent-2: #4a9eff; /* Blue highlight */
  --color-text: #e8ecf0; /* Primary text */
  --color-text-muted: #7a8499; /* Secondary text */
  --color-danger: #ff4d6d;
  --color-success: #00d68f;
}
```

### Typography

- **Display**: `Bebas Neue` (headings, scoreboard-style numbers)
- **UI**: `DM Sans` (labels, buttons, navigation)
- **Body**: `Lora` (drill descriptions, rich text)
- **Mono**: `JetBrains Mono` (tags, codes)

### Skill Level Color Coding

```
Beginner     → green  (#00d68f)
Intermediate → blue   (#4a9eff)
Advanced     → orange (#ff9500)
Elite        → red    (#ff4d6d)
```

### Age Range Icons

U12 🟡 · U14 🟠 · U16 🔵 · U18 🟣 · Adults ⚫ · All 🌐

---

## Tag Taxonomy

### Focus Areas (primary)

`serving` `reception` `setting` `attack` `block` `defense` `tactics` `fitness` `warmup` `fun` `mental`

### Sub-tags (secondary, free-choice)

`back-row-attack` `jump-serve` `float-serve` `pipe` `quick-set` `libero-coverage` `rotation` `transition` `emergency-defense` `team-building` `communication`

---

## Key Implementation Notes

### Security

- Passwords hashed with `bcrypt` directly (do NOT use `passlib` — it is incompatible with `bcrypt>=4.0`)
- Input validated server-side with Pydantic
- Ownership checks on every mutating endpoint (user can only edit their own content)
- Rate limiting on auth endpoints (`slowapi`)
- CORS restricted to frontend origin

### File Storage

- **Local (dev/early prod)**: files saved to `backend/uploads/`, served via FastAPI static mount at `/static/uploads/`
- **S3 (production)**: swap local write/read calls for `boto3` upload — abstracted behind a `StorageService` interface so the rest of the code doesn't change
- Thumbnails are PNG exports from the drawing canvas, uploaded on save

### Frontend API calls

- Axios `baseURL` must be `''` (empty string) — never point it directly at `http://localhost:8000`
- All `/api/*` and `/static/*` requests are proxied through Vite's dev server to the backend (configured in `vite.config.js`)
- The proxy target uses `process.env.BACKEND_URL` (no `VITE_` prefix) — env vars prefixed with `VITE_` are exposed to the browser bundle; `backend:8000` as a browser URL causes `ERR_NAME_NOT_RESOLVED` since Docker service names only resolve inside the Docker network

### Performance

- Paginate all list endpoints (default 20 items/page)
- Drawing JSON can get large — compress with LZ-string before storing
- Lazy load drill drawings (only load Konva when drawing tab is active)
- Use React.memo and useCallback liberally in the canvas component

### Accessibility

- All icons have `aria-label`
- Keyboard navigation for drill reordering in session (arrow keys)
- Focus trap in modals
- WCAG AA contrast ratios on text

---

## Development Order

### Phase 1 — Foundation ✅

- [x] Docker Compose setup (`postgres`, `backend`, `frontend` services)
- [x] FastAPI project structure (routers, models, schemas, dependencies)
- [x] SQLAlchemy models + Alembic initial migration
- [x] Auth system: register, login, logout, `/me` (JWT in httpOnly cookies)
- [x] Drill CRUD API (no drawing yet)
- [x] React + Vite scaffold with Tailwind and design system tokens
- [x] Drill list + detail pages (read-only, no auth required)

### Phase 1.5 — My Drills & Edit (priority before Phase 2) ✅

- [x] Dashboard page (`/me`) — lists all own drills (public + private drafts) with edit/delete actions
- [x] Drill edit page (`/drills/:id/edit`) — pre-filled form, saves via PATCH
- [x] Routes wired up in App.jsx and Navbar link added

### Phase 2 — Sessions & Discovery

- [ ] Session CRUD API + pages
- [ ] Drill picker UI: search/filter existing drills and add them to a session
- [ ] Drag-to-reorder drills within a session (`@dnd-kit/sortable`)
- [ ] Per-drill fields inside a session: duration override, coach notes
- [ ] Auto-calculated total duration from drills
- [ ] Filter + search system (age range, skill level, focus area, text search)
- [ ] Like system (auth required)
- [ ] Local file upload endpoint (avatar, drill thumbnails → `uploads/`)
- [ ] PDF export of a training session

### Phase 3 — Drawing Tool _(required for MVP)_

- [ ] Volleyball court canvas (`react-konva`)
- [ ] Icon palette + drag-to-court (native HTML5 drag or pointer events)
- [ ] Move / resize / rotate icons on canvas
- [ ] Arrow drawing tool (straight + curved)
- [ ] Undo / redo (Zustand history, max 50 snapshots)
- [ ] PNG export → POST to backend → saved locally, URL stored on drill

### Phase 4 — Polish & Go Live

- [x] User profiles + public profile pages
- [x] Dashboard (my drills, my sessions, liked content)
- [ ] Responsive mobile layout
- [ ] Loading states, error boundaries, empty states
- [x] Deploy to Railway — **architecture decided and implemented**
- [ ] Migrate file storage from local to AWS S3

#### Railway Deployment (implemented)

**Architecture: single Railway service** — multi-stage Dockerfile at repo root (Node builds frontend → Python copies `dist/` and serves via FastAPI). No reverse proxy needed; same-origin eliminates CORS.

**Files created/modified:**

- `Dockerfile` (root) — multi-stage build; `RUN rm -f package-lock.json && npm install` required (macOS lock file missing linux-musl rollup binary)
- `railway.toml` — `dockerfilePath = "Dockerfile"`, healthcheck at `/health`
- `backend/app/config.py` — added `frontend_dist_dir: str = "./frontend_dist"`
- `backend/app/main.py` — catch-all SPA route active only when `frontend_dist/` dir exists (no effect locally)

**Railway one-time manual setup:**

1. Create project → Deploy from GitHub
2. Add PostgreSQL plugin (auto-injects `DATABASE_URL`)
3. Add Volume mounted at `/app/uploads`
4. Set env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL=https://<domain>.railway.app`

**Cost:** Hobby plan $5/month (includes $5 resource credit — small app stays within it)

### Access Model

- All public drills and sessions are **readable without login**
- Auth is required to: create, edit, delete, like
- This allows testing and demoing the app without accounts

---

## Session Builder — Detailed Spec

### Concept

A session is an ordered list of drills with a total duration, target age/skill level, and optional per-drill coach notes. Coaches build sessions by picking drills from their library (or public drills) and arranging them into a training plan.

### Session Builder UI (`/sessions/new`, `/sessions/:id/edit`)

1. **Metadata form** — title, description, age range, skill level, focus areas (multi), team size, public toggle
2. **Drill picker panel** — slide-out or inline panel showing drill library with search + filters; clicking a drill appends it to the session
3. **Session drill list** — ordered list of added drills, each row showing:
   - Drill title + focus badge
   - Duration (editable override, defaults to drill's `duration_minutes`)
   - Coach notes textarea (session-specific, stored in `DrillSession.coach_notes`)
   - Drag handle (reorder via `@dnd-kit/sortable`)
   - Remove button
4. **Summary bar** — sticky footer showing total duration (auto-summed) and drill count
5. **Export button** — "Export PDF" → triggers PDF generation

### Key frontend components

```
src/components/session/
├── SessionForm.jsx          # Metadata fields
├── SessionDrillList.jsx     # Sortable drill list (dnd-kit)
├── SessionDrillRow.jsx      # Single drill in session with overrides
├── DrillPickerPanel.jsx     # Searchable drill selector
└── SessionDetail.jsx        # Read-only view + export button
```

### Backend: Session API

Already defined in API Endpoints section. Key additions:

- `GET /api/sessions/:id` returns the full session with drills array (each drill fully populated, not just IDs)
- `POST /api/sessions/:id/drills` — add a drill, returns updated session
- `PATCH /api/sessions/:id/drills` — reorder (accepts `[{drill_session_id, order_index}]`)
- `DELETE /api/sessions/:id/drills/:drill_session_id` — remove a drill
- `GET /api/sessions/:id/export/pdf` — generate and return PDF (see below)

---

## PDF Export — Detailed Spec

### Approach: server-side generation with `WeasyPrint`

Generate the PDF on the backend from an HTML template. This gives full control over layout and allows embedding drill thumbnails (drawing images).

**Why server-side over client-side (`jsPDF`)**:

- Can embed server-stored images (drawing thumbnails) without CORS issues
- Consistent rendering regardless of browser
- Cleaner pagination for long sessions
- No large JS bundle on the frontend

### Backend implementation

```
pip install weasyprint jinja2
```

**Template** (`backend/templates/session_export.html`):
Jinja2 HTML template styled with inline CSS (WeasyPrint doesn't support all CSS). Layout:

- Header: session title, coach name, date, total duration, age/skill badges
- For each drill (in order):
  - Drill title + focus area badge
  - Duration + players
  - Description
  - Drawing thumbnail (if available — embed as base64 img src)
  - Coach notes (if set on the DrillSession)
- Footer: page numbers, "Generated with VC Planner"

**Endpoint**:

```python
# GET /api/sessions/:id/export/pdf
@router.get("/{session_id}/export/pdf")
async def export_session_pdf(session_id: str, ...):
    # 1. Load session + drills from DB
    # 2. Render Jinja2 template to HTML string
    # 3. WeasyPrint: HTML → PDF bytes
    # 4. Return StreamingResponse(pdf_bytes, media_type="application/pdf",
    #       headers={"Content-Disposition": f'attachment; filename="{session.title}.pdf"'})
```

### Frontend

Simple button on the session detail page:

```jsx
<a href={`/api/sessions/${id}/export/pdf`} download>
  <Button variant="secondary">Export PDF</Button>
</a>
```

No special JS needed — the browser follows the link, the backend streams the PDF, the browser triggers a file download.

### PDF layout (print-ready A4)

```
┌─────────────────────────────────────────┐
│  SESSION TITLE                    90min │
│  Coach Name · U16 · Intermediate        │
├─────────────────────────────────────────┤
│  1. Drill Title              [15 min]   │
│     Focus: Reception  Players: 6–12     │
│     [thumbnail image]                   │
│     Description text...                 │
│     Coach notes: watch the setter...    │
├─────────────────────────────────────────┤
│  2. Next Drill               [20 min]   │
│     ...                                 │
└─────────────────────────────────────────┘
```

### Python dependencies to add to `requirements.txt`

```
weasyprint==62.3
jinja2==3.1.4
```

> **Note**: WeasyPrint requires system libraries (`libpango`, `libcairo`). Add to `backend/Dockerfile`:
>
> ```dockerfile
> RUN apt-get update && apt-get install -y \
>     libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf2.0-0 \
>     && rm -rf /var/lib/apt/lists/*
> ```

---

## Future Ideas (Post-MVP)

### Social & Community Features

- **Likes**: Heart button on drills and sessions — backend model (`Like`) and toggle endpoint already exist, needs frontend UI wired up properly
- **Favourites**: Save drills/sessions to a personal favourites list (separate from likes — a like is public social signal, a favourite is a private bookmark). Requires a `Favourite` model (similar to `Like`) + a `/me/favourites` page
- **Comments**: Threaded comments on drills and sessions. Requires a `Comment` model (`id`, `user_id`, `drill_id` or `session_id`, `body`, `created_at`, optional `parent_id` for replies). Frontend: comment thread component below drill detail, reply button, delete own comment. Moderation: owners can delete any comment on their content.

### Other Future Ideas

- **OAuth / social login**: Google login (structure already supports it)
- **AWS S3 migration**: Swap local storage for S3 (storage interface already abstracted)
- **Team management**: Invite team members, assign sessions
- **Session templates**: Fork a public session and customize it
- **Analytics**: How many coaches used this drill, ratings over time
- **Video integration**: Embed YouTube drill demos inline
- **Multilingual support**: German + English (important for German league coaches)
- **Mobile app**: React Native port of the drawing tool
- **AI drill suggestions**: Given focus area + skill level, suggest drills from the library
- **Tests**: Unit tests for business logic, integration tests for API endpoints

---

## Local Development Setup

```bash
# Clone and install
git clone https://github.com/<you>/volley-coach-planner
cd volley-coach-planner

# Start everything (rebuilds images if code changed)
docker compose up --build

# First-time database setup (run once after containers are up):
docker compose exec backend alembic revision --autogenerate -m "initial"
docker compose exec backend alembic upgrade head

# Wipe DB and start fresh:
docker compose down -v
```

**Environment variables needed:**

```env
# Backend (backend/.env)
DATABASE_URL=postgresql+asyncpg://volleycoach:volleycoach@localhost:5432/volleycoach
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5173

# AWS S3 (only needed in production)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=...
# AWS_REGION=...

# Frontend: no .env needed — Vite proxy handles routing to backend
```

---

_This document is the living specification for the Volleyball Coach Training Planner. Update it as features evolve._
