# ── Stage 1: Build frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN rm -f package-lock.json && npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Backend + built frontend ────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y fonts-liberation fontconfig \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt backend/requirements-s3.txt ./
# Install boto3 only when STORAGE_BACKEND=s3 is set (keeps image smaller for local storage)
ARG STORAGE_BACKEND=local
RUN pip install --no-cache-dir -r requirements.txt && \
    if [ "$STORAGE_BACKEND" = "s3" ]; then pip install --no-cache-dir -r requirements-s3.txt; fi
COPY backend/ .
COPY --from=frontend-build /app/dist ./frontend_dist
RUN mkdir -p uploads
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
