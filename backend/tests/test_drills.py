"""Integration tests for /api/drills endpoints."""
from tests.conftest import DRILL_PAYLOAD, USER1, USER2


async def test_list_drills_public_no_auth(client):
    r = await client.get("/api/drills")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


async def test_create_drill_requires_auth(client):
    r = await client.post("/api/drills", json=DRILL_PAYLOAD)
    assert r.status_code == 401


async def test_create_drill_success(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.post("/api/drills", json=DRILL_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == DRILL_PAYLOAD["title"]
    assert data["is_public"] is True


async def test_get_drill_public(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    # Clear auth to simulate unauthenticated access
    client.cookies.clear()
    r = await client.get(f"/api/drills/{created['id']}")
    assert r.status_code == 200


async def test_get_private_drill_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    private_drill = {**DRILL_PAYLOAD, "is_public": False}
    created = (await client.post("/api/drills", json=private_drill)).json()
    r = await client.get(f"/api/drills/{created['id']}")
    assert r.status_code == 200


async def test_get_private_drill_by_other_user_returns_403(client):
    # Register user1 and create a private drill
    await client.post("/api/auth/register", json=USER1)
    private_drill = {**DRILL_PAYLOAD, "is_public": False}
    created = (await client.post("/api/drills", json=private_drill)).json()
    drill_id = created["id"]

    # Register user2 (overwrites client's cookie jar)
    await client.post("/api/auth/register", json=USER2)
    r = await client.get(f"/api/drills/{drill_id}")
    assert r.status_code == 403


async def test_get_private_drill_unauthenticated_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    private_drill = {**DRILL_PAYLOAD, "is_public": False}
    created = (await client.post("/api/drills", json=private_drill)).json()
    drill_id = created["id"]

    client.cookies.clear()
    r = await client.get(f"/api/drills/{drill_id}")
    assert r.status_code == 403


async def test_get_nonexistent_drill_returns_404(client):
    r = await client.get("/api/drills/nonexistent-id")
    assert r.status_code == 404


async def test_update_drill_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.patch(f"/api/drills/{created['id']}", json={"title": "Updated Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


async def test_update_drill_by_other_user_returns_403(client):
    # User1 creates a drill
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    drill_id = created["id"]

    # User2 tries to update
    await client.post("/api/auth/register", json=USER2)
    r = await client.patch(f"/api/drills/{drill_id}", json={"title": "Hacked"})
    assert r.status_code == 403


async def test_delete_drill_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.delete(f"/api/drills/{created['id']}")
    assert r.status_code == 204


async def test_delete_drill_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    drill_id = created["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.delete(f"/api/drills/{drill_id}")
    assert r.status_code == 403


async def test_like_drill_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    client.cookies.clear()
    r = await client.post(f"/api/drills/{created['id']}/like")
    assert r.status_code == 401


async def test_like_drill_toggle(client):
    # User1 creates a public drill
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    drill_id = created["id"]

    # User2 likes the drill
    await client.post("/api/auth/register", json=USER2)
    r1 = await client.post(f"/api/drills/{drill_id}/like")
    assert r1.status_code == 200
    assert r1.json()["liked"] is True

    # User2 unlikes the drill
    r2 = await client.post(f"/api/drills/{drill_id}/like")
    assert r2.status_code == 200
    assert r2.json()["liked"] is False


async def test_my_drills_requires_auth(client):
    r = await client.get("/api/drills/mine")
    assert r.status_code == 401


async def test_my_drills_returns_own_drills(client):
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/drills", json=DRILL_PAYLOAD)
    await client.post("/api/drills", json={**DRILL_PAYLOAD, "title": "Second Drill"})
    r = await client.get("/api/drills/mine")
    assert r.status_code == 200
    assert r.json()["total"] == 2
