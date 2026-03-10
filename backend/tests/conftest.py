"""
Shared pytest fixtures for integration tests.

Test database strategy:
- Tables are created once per session via a sync autouse fixture (asyncio.run()),
  which runs in its own isolated event loop before any tests start.
- Each test function gets a brand-new AsyncEngine + AsyncSession in the test's
  own event loop — no cross-loop sharing, no asyncpg "another operation in
  progress" errors.
- The session does NOT commit, so all writes are rolled back at teardown,
  keeping tests isolated without recreating the schema each time.

Running tests requires a running PostgreSQL instance with a 'volleycoach_test'
database. With Docker Compose running locally:
  docker compose exec postgres psql -U volleycoach -c "CREATE DATABASE volleycoach_test;"
  docker compose exec -e TESTING=1 backend pytest -v
"""
import asyncio
import os

# Set TESTING=1 before any app imports so the rate limiter uses unique per-request
# keys (avoiding rate limit accumulation across test runs).
os.environ["TESTING"] = "1"

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402 — imports all models, registering them with metadata

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    # Inside Docker Compose the service is reachable at hostname "postgres".
    # Override with TEST_DATABASE_URL=... when running outside Docker.
    "postgresql+asyncpg://volleycoach:volleycoach@postgres:5432/volleycoach_test",
)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once before any test runs, drop them at the end.

    Uses asyncio.run() in a plain sync fixture so it gets its own isolated
    event loop — completely separate from the per-test loops that
    pytest-asyncio 0.23 creates for each async test function.
    """
    async def _setup():
        engine = create_async_engine(TEST_DATABASE_URL)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def _teardown():
        engine = create_async_engine(TEST_DATABASE_URL)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_setup())
    yield
    asyncio.run(_teardown())


@pytest_asyncio.fixture
async def client():
    """Per-test HTTP client.

    Creates a fresh AsyncEngine and AsyncSession in the current test's event
    loop.  The session does NOT commit — all writes are rolled back at teardown
    so each test starts with a clean database.
    """
    engine = create_async_engine(TEST_DATABASE_URL)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=True)

    async with Session() as session:
        async def override_get_db():
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

        app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac

        app.dependency_overrides.clear()
        await session.rollback()

    await engine.dispose()


# ---------------------------------------------------------------------------
# Reusable helper payloads
# ---------------------------------------------------------------------------

USER1 = {"email": "user1@test.com", "password": "securepass1", "name": "User One"}
USER2 = {"email": "user2@test.com", "password": "securepass2", "name": "User Two"}

DRILL_PAYLOAD = {
    "title": "Serve and Receive",
    "description": "Basic serve and receive drill",
    "duration_minutes": 20,
    "is_public": True,
}

SESSION_PAYLOAD = {
    "title": "Morning Practice",
    "description": "Full team warm-up session",
    "is_public": True,
}
