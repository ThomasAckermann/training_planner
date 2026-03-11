"""Integration tests for the user follow/unfollow endpoints."""

from tests.conftest import USER1, USER2


async def _get_user_id(client, email, password):
    await client.post("/api/auth/login", json={"email": email, "password": password})
    me = await client.get("/api/auth/me")
    return me.json()["id"]


async def test_follow_user(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.post(f"/api/users/{user1_id}/follow")
    assert r.status_code == 200
    assert r.json()["following"] is True


async def test_unfollow_user(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]

    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")
    r = await client.post(f"/api/users/{user1_id}/follow")
    assert r.json()["following"] is False


async def test_cannot_follow_yourself(client):
    await client.post("/api/auth/register", json=USER1)
    user_id = (await client.get("/api/auth/me")).json()["id"]
    r = await client.post(f"/api/users/{user_id}/follow")
    assert r.status_code == 400


async def test_follow_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    user_id = (await client.get("/api/auth/me")).json()["id"]
    client.cookies.clear()
    r = await client.post(f"/api/users/{user_id}/follow")
    assert r.status_code == 401


async def test_follower_count_on_profile(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]

    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")

    r = await client.get(f"/api/users/{user1_id}")
    assert r.status_code == 200
    profile = r.json()
    assert profile["follower_count"] == 1
    assert profile["following_count"] == 0


async def test_following_count_on_profile(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]

    await client.post("/api/auth/register", json=USER2)
    user2_id = (await client.get("/api/auth/me")).json()["id"]

    # User2 follows user1
    await client.post(f"/api/users/{user1_id}/follow")

    # Check user2 profile — should show following_count=1
    r = await client.get(f"/api/users/{user2_id}")
    assert r.json()["following_count"] == 1


async def test_is_following_flag(client):
    await client.post("/api/auth/register", json=USER1)
    user1_id = (await client.get("/api/auth/me")).json()["id"]

    await client.post("/api/auth/register", json=USER2)
    await client.post(f"/api/users/{user1_id}/follow")

    r = await client.get(f"/api/users/{user1_id}")
    assert r.json()["is_following"] is True
