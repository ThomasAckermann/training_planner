import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter
from app.routers import auth, drills, sessions, users

app = FastAPI(
    title="Volley Coach Planner API",
    description="API for the Volleyball Coach Training Planner",
    version="1.0.0",
    redirect_slashes=False,
    # Disable interactive docs in production to reduce attack surface.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
    return response


# Include routers
app.include_router(auth.router)
app.include_router(drills.router)
app.include_router(sessions.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup_event() -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)


# Mount static files for uploaded content
upload_dir = settings.upload_dir
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=upload_dir), name="static")


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


# Serve React SPA (only active when frontend_dist exists — i.e. production build)
_frontend_dist = settings.frontend_dist_dir
if os.path.isdir(_frontend_dist):
    _frontend_dist_real = os.path.realpath(_frontend_dist)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        candidate = os.path.realpath(os.path.join(_frontend_dist_real, full_path))
        # Prevent path traversal: ensure candidate is inside the dist directory.
        if (
            not candidate.startswith(_frontend_dist_real + os.sep)
            and candidate != _frontend_dist_real
        ):
            return FileResponse(os.path.join(_frontend_dist_real, "index.html"))
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_frontend_dist_real, "index.html"))
