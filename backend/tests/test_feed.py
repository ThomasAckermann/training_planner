"""Integration tests for the /api/feed endpoint."""

from tests.conftest import DRILL_PAYLOAD, SESSION_PAYLOAD, USER1, USER2


async def test_feed_empty_when_not_following(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.get("/api/feed")
    assert r.status_code == 200
    data = r.json()
    assert data["drills"] == []
    assert data["sessions"] == []


async def test_feed_requires_auth(client):
    r = await client.get("/api/feed")
    assert r.status_code == 401


async def test_feed_shows_followed_user_content(client):
    # User1 creates a public drill and session
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]
    await client.post("/api/drills", json=DRILL_PAYLOAD)
    await client.post("/api/sessions", json=SESSION_PAYLOAD)

    # User2 follows user1
    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")

    r = await client.get("/api/feed")
    assert r.status_code == 200
    data = r.json()
    assert len(data["drills"]) == 1
    assert len(data["sessions"]) == 1
    assert data["drills"][0]["user_id"] == user1_id


async def test_feed_excludes_private_content(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]
    # Create private content
    await client.post("/api/drills", json={**DRILL_PAYLOAD, "is_public": False})
    await client.post("/api/sessions", json={**SESSION_PAYLOAD, "is_public": False})

    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")

    r = await client.get("/api/feed")
    data = r.json()
    assert data["drills"] == []
    assert data["sessions"] == []


async def test_feed_excludes_unfollowed_users(client):
    # User1 creates public content but user2 doesn't follow them
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/drills", json=DRILL_PAYLOAD)

    await client.post("/api/auth/register", json=USER2)
    r = await client.get("/api/feed")
    assert r.json()["drills"] == []


async def test_feed_updates_after_unfollow(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]
    await client.post("/api/drills", json=DRILL_PAYLOAD)

    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")

    # Confirm feed has content
    assert len((await client.get("/api/feed")).json()["drills"]) == 1

    # Unfollow
    await client.post(f"/api/users/{user1_id}/follow")

    # Feed should be empty now
    assert (await client.get("/api/feed")).json()["drills"] == []
