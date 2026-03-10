import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, drills, sessions, users

app = FastAPI(
    title="Volley Coach Planner API",
    description="API for the Volleyball Coach Training Planner",
    version="1.0.0",
    redirect_slashes=False,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        candidate = os.path.join(_frontend_dist, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_frontend_dist, "index.html"))
