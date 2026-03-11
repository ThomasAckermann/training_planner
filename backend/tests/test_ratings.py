"""Integration tests for the drill rating endpoint."""

from tests.conftest import DRILL_PAYLOAD, USER1, USER2


async def test_rate_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(f"/api/drills/{drill['id']}/rate?score=4")
    assert r.status_code == 200
    assert r.json()["avg_rating"] == 4.0


async def test_rate_drill_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    client.cookies.clear()
    r = await client.post(f"/api/drills/{drill['id']}/rate?score=3")
    assert r.status_code == 401


async def test_rate_drill_invalid_score(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(f"/api/drills/{drill['id']}/rate?score=6")
    assert r.status_code == 422


async def test_rate_drill_score_zero_rejected(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(f"/api/drills/{drill['id']}/rate?score=0")
    assert r.status_code == 422


async def test_update_rating(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/rate?score=2")
    r = await client.post(f"/api/drills/{drill['id']}/rate?score=5")
    assert r.status_code == 200
    # Rating should reflect the updated score (single user so avg = 5)
    assert r.json()["avg_rating"] == 5.0
    assert r.json()["rating_count"] == 1


async def test_avg_rating_multiple_users(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    drill_id = drill["id"]

    await client.post(f"/api/drills/{drill_id}/rate?score=3")

    await client.post("/api/auth/register", json=USER2)
    r = await client.post(f"/api/drills/{drill_id}/rate?score=5")
    assert r.status_code == 200
    data = r.json()
    assert data["rating_count"] == 2
    assert data["avg_rating"] == 4.0


async def test_drill_detail_includes_avg_rating(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/rate?score=4")
    r = await client.get(f"/api/drills/{drill['id']}")
    assert r.status_code == 200
    data = r.json()
    assert "avg_rating" in data
    assert data["avg_rating"] == 4.0
