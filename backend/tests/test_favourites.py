"""Integration tests for drill and session favourite (bookmark) endpoints."""

from tests.conftest import DRILL_PAYLOAD, SESSION_PAYLOAD, USER1, USER2


async def test_favourite_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(f"/api/drills/{drill['id']}/favourite")
    assert r.status_code == 200
    assert r.json()["favourited"] is True


async def test_unfavourite_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/favourite")
    r = await client.post(f"/api/drills/{drill['id']}/favourite")
    assert r.json()["favourited"] is False


async def test_favourite_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    client.cookies.clear()
    r = await client.post(f"/api/drills/{drill['id']}/favourite")
    assert r.status_code == 401


async def test_favourite_session(client):
    await client.post("/api/auth/register", json=USER1)
    session = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()
    r = await client.post(f"/api/sessions/{session['id']}/favourite")
    assert r.status_code == 200
    assert r.json()["favourited"] is True


async def test_unfavourite_session(client):
    await client.post("/api/auth/register", json=USER1)
    session = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()
    await client.post(f"/api/sessions/{session['id']}/favourite")
    r = await client.post(f"/api/sessions/{session['id']}/favourite")
    assert r.json()["favourited"] is False


async def test_get_my_favourites_empty(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.get("/api/users/me/favourites")
    assert r.status_code == 200
    data = r.json()
    assert data["drills"] == []
    assert data["sessions"] == []


async def test_get_my_favourites_includes_favourited_items(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    session = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/favourite")
    await client.post(f"/api/sessions/{session['id']}/favourite")

    r = await client.get("/api/users/me/favourites")
    assert r.status_code == 200
    data = r.json()
    assert len(data["drills"]) == 1
    assert data["drills"][0]["id"] == drill["id"]
    assert len(data["sessions"]) == 1
    assert data["sessions"][0]["id"] == session["id"]


async def test_favourites_are_user_specific(client):
    # User1 favourites a drill
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/favourite")

    # User2 should have empty favourites
    await client.post("/api/auth/register", json=USER2)
    r = await client.get("/api/users/me/favourites")
    assert r.json()["drills"] == []
