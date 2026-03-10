"""Integration tests for /api/sessions endpoints."""

from tests.conftest import DRILL_PAYLOAD, SESSION_PAYLOAD, USER1, USER2


async def _create_drill(client) -> str:
    r = await client.post("/api/drills", json=DRILL_PAYLOAD)
    assert r.status_code == 201
    return r.json()["id"]


async def _create_session(client) -> str:
    r = await client.post("/api/sessions", json=SESSION_PAYLOAD)
    assert r.status_code == 201
    return r.json()["id"]


async def test_list_sessions_public_no_auth(client):
    r = await client.get("/api/sessions")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


async def test_create_session_requires_auth(client):
    r = await client.post("/api/sessions", json=SESSION_PAYLOAD)
    assert r.status_code == 401


async def test_create_session_success(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.post("/api/sessions", json=SESSION_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == SESSION_PAYLOAD["title"]
    assert data["drills"] == []


async def test_get_session_with_drills(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)
    drill_id = await _create_drill(client)

    add_r = await client.post(
        f"/api/sessions/{session_id}/drills", json={"drill_id": drill_id}
    )
    assert add_r.status_code == 200

    r = await client.get(f"/api/sessions/{session_id}")
    assert r.status_code == 200
    data = r.json()
    assert len(data["drills"]) == 1
    assert data["drills"][0]["id"] == drill_id


async def test_add_drill_to_session(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)
    drill_id = await _create_drill(client)

    r = await client.post(
        f"/api/sessions/{session_id}/drills", json={"drill_id": drill_id}
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["drills"]) == 1


async def test_remove_drill_from_session(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)
    drill_id = await _create_drill(client)

    session_data = (
        await client.post(
            f"/api/sessions/{session_id}/drills", json={"drill_id": drill_id}
        )
    ).json()
    drill_session_id = session_data["drills"][0]["drill_session_id"]

    r = await client.delete(f"/api/sessions/{session_id}/drills/{drill_session_id}")
    assert r.status_code == 200
    assert r.json()["drills"] == []


async def test_reorder_drills_in_session(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)

    drill1_id = await _create_drill(client)
    drill2_id = (
        await client.post("/api/drills", json={**DRILL_PAYLOAD, "title": "Drill Two"})
    ).json()["id"]

    await client.post(
        f"/api/sessions/{session_id}/drills", json={"drill_id": drill1_id}
    )
    session_data = (
        await client.post(
            f"/api/sessions/{session_id}/drills", json={"drill_id": drill2_id}
        )
    ).json()

    ds1_id = session_data["drills"][0]["drill_session_id"]
    ds2_id = session_data["drills"][1]["drill_session_id"]

    # Reverse order
    r = await client.patch(
        f"/api/sessions/{session_id}/drills",
        json={"drill_session_ids": [ds2_id, ds1_id]},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["drills"][0]["drill_session_id"] == ds2_id
    assert data["drills"][1]["drill_session_id"] == ds1_id


async def test_update_session_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)

    await client.post("/api/auth/register", json=USER2)
    r = await client.patch(f"/api/sessions/{session_id}", json={"title": "Hacked"})
    assert r.status_code == 403


async def test_delete_session_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)
    r = await client.delete(f"/api/sessions/{session_id}")
    assert r.status_code == 204


async def test_delete_session_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = await _create_session(client)

    await client.post("/api/auth/register", json=USER2)
    r = await client.delete(f"/api/sessions/{session_id}")
    assert r.status_code == 403


async def test_my_sessions_requires_auth(client):
    r = await client.get("/api/sessions/mine")
    assert r.status_code == 401


async def test_my_sessions_returns_own_sessions(client):
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.post(
        "/api/sessions", json={**SESSION_PAYLOAD, "title": "Evening Practice"}
    )
    r = await client.get("/api/sessions/mine")
    assert r.status_code == 200
    assert r.json()["total"] == 2
