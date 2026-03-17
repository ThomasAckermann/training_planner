"""Integration tests for /api/modules endpoints and module expansion into sessions."""

from tests.conftest import DRILL_PAYLOAD, SESSION_PAYLOAD, USER1, USER2

MODULE_PAYLOAD = {
    "title": "Standard Warm-Up",
    "phase_type": "WARMUP",
    "description": "Basic warm-up routine",
    "is_public": True,
    "drills": [],
}


async def _register_and_create_drill(client, user=USER1) -> str:
    """Register user (no-op if already registered) and create a drill; returns drill id."""
    await client.post("/api/auth/register", json=user)
    r = await client.post("/api/drills", json=DRILL_PAYLOAD)
    assert r.status_code == 201
    return r.json()["id"]


# ---------------------------------------------------------------------------
# Auth guards
# ---------------------------------------------------------------------------


async def test_list_modules_requires_auth(client):
    r = await client.get("/api/modules")
    assert r.status_code == 401


async def test_create_module_requires_auth(client):
    r = await client.post("/api/modules", json=MODULE_PAYLOAD)
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


async def test_create_module_success(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.post("/api/modules", json=MODULE_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == MODULE_PAYLOAD["title"]
    assert data["phase_type"] == "WARMUP"
    assert data["is_public"] is True
    assert data["drills"] == []


async def test_create_module_with_drills(client):
    drill_id = await _register_and_create_drill(client)
    payload = {
        **MODULE_PAYLOAD,
        "drills": [{"drill_id": drill_id, "order_index": 0}],
    }
    r = await client.post("/api/modules", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert len(data["drills"]) == 1
    assert data["drills"][0]["drill_id"] == drill_id


async def test_create_module_private(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.post(
        "/api/modules",
        json={**MODULE_PAYLOAD, "is_public": False, "title": "My Private Module"},
    )
    assert r.status_code == 201
    assert r.json()["is_public"] is False


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


async def test_list_modules_includes_own_and_public(client):
    # User1 creates a public module
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/modules", json=MODULE_PAYLOAD)

    # User2 creates a private module + a public module
    await client.post("/api/auth/register", json=USER2)
    await client.post(
        "/api/modules",
        json={**MODULE_PAYLOAD, "title": "User2 Private", "is_public": False},
    )
    await client.post(
        "/api/modules",
        json={**MODULE_PAYLOAD, "title": "User2 Public", "is_public": True},
    )

    r = await client.get("/api/modules")
    assert r.status_code == 200
    titles = [m["title"] for m in r.json()]
    # User2 sees: User1 public, User2 private (own), User2 public
    assert MODULE_PAYLOAD["title"] in titles
    assert "User2 Private" in titles
    assert "User2 Public" in titles


async def test_list_modules_excludes_other_private(client):
    # User1 creates a private module
    await client.post("/api/auth/register", json=USER1)
    await client.post(
        "/api/modules", json={**MODULE_PAYLOAD, "title": "Hidden", "is_public": False}
    )

    # User2 cannot see it
    await client.post("/api/auth/register", json=USER2)
    r = await client.get("/api/modules")
    assert r.status_code == 200
    titles = [m["title"] for m in r.json()]
    assert "Hidden" not in titles


async def test_list_modules_filter_by_phase_type(client):
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/modules", json={**MODULE_PAYLOAD, "phase_type": "WARMUP"})
    await client.post(
        "/api/modules",
        json={**MODULE_PAYLOAD, "title": "Main Block", "phase_type": "MAIN"},
    )

    r = await client.get("/api/modules?phase_type=WARMUP")
    assert r.status_code == 200
    for m in r.json():
        assert m["phase_type"] == "WARMUP"


async def test_get_my_modules(client):
    await client.post("/api/auth/register", json=USER1)
    await client.post("/api/modules", json=MODULE_PAYLOAD)
    await client.post(
        "/api/modules",
        json={**MODULE_PAYLOAD, "title": "Cool-Down Routine", "phase_type": "COOLDOWN"},
    )

    r = await client.get("/api/modules/mine")
    assert r.status_code == 200
    assert len(r.json()) == 2


# ---------------------------------------------------------------------------
# Get single
# ---------------------------------------------------------------------------


async def test_get_module_by_id(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()

    r = await client.get(f"/api/modules/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


async def test_get_nonexistent_module_returns_404(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.get("/api/modules/nonexistent-id")
    assert r.status_code == 404


async def test_get_private_module_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    created = (
        await client.post("/api/modules", json={**MODULE_PAYLOAD, "is_public": False})
    ).json()
    module_id = created["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.get(f"/api/modules/{module_id}")
    assert r.status_code == 403


async def test_get_public_module_by_other_user(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()
    module_id = created["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.get(f"/api/modules/{module_id}")
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


async def test_update_module_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()

    r = await client.patch(
        f"/api/modules/{created['id']}",
        json={"title": "Updated Warm-Up", "phase_type": "MAIN"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Updated Warm-Up"
    assert data["phase_type"] == "MAIN"


async def test_update_module_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()
    module_id = created["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.patch(f"/api/modules/{module_id}", json={"title": "Hacked"})
    assert r.status_code == 403


async def test_update_module_drills(client):
    drill_id = await _register_and_create_drill(client)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()

    r = await client.patch(
        f"/api/modules/{created['id']}",
        json={"drills": [{"drill_id": drill_id, "order_index": 0}]},
    )
    assert r.status_code == 200
    assert len(r.json()["drills"]) == 1
    assert r.json()["drills"][0]["drill_id"] == drill_id


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


async def test_delete_module_by_owner(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()
    r = await client.delete(f"/api/modules/{created['id']}")
    assert r.status_code == 204


async def test_delete_module_by_other_user_returns_403(client):
    await client.post("/api/auth/register", json=USER1)
    created = (await client.post("/api/modules", json=MODULE_PAYLOAD)).json()
    module_id = created["id"]

    await client.post("/api/auth/register", json=USER2)
    r = await client.delete(f"/api/modules/{module_id}")
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Expand module into session
# ---------------------------------------------------------------------------


async def test_expand_module_into_session(client):
    drill_id = await _register_and_create_drill(client)
    second_drill_id = (
        await client.post("/api/drills", json={**DRILL_PAYLOAD, "title": "Drill Two"})
    ).json()["id"]

    # Create module with 2 drills
    module_payload = {
        **MODULE_PAYLOAD,
        "phase_type": "WARMUP",
        "drills": [
            {"drill_id": drill_id, "order_index": 0},
            {"drill_id": second_drill_id, "order_index": 1},
        ],
    }
    module_id = (await client.post("/api/modules", json=module_payload)).json()["id"]

    # Create a session and expand the module into it
    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]
    r = await client.post(f"/api/sessions/{session_id}/modules/{module_id}")
    assert r.status_code == 200

    data = r.json()
    assert len(data["drills"]) == 2
    drill_ids = [d["id"] for d in data["drills"]]
    assert drill_id in drill_ids
    assert second_drill_id in drill_ids


async def test_expand_module_sets_phase_label(client):
    drill_id = await _register_and_create_drill(client)
    module_payload = {
        **MODULE_PAYLOAD,
        "phase_type": "COOLDOWN",
        "drills": [{"drill_id": drill_id, "order_index": 0}],
    }
    module_id = (await client.post("/api/modules", json=module_payload)).json()["id"]

    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]
    r = await client.post(f"/api/sessions/{session_id}/modules/{module_id}")
    assert r.status_code == 200

    drills = r.json()["drills"]
    assert drills[0]["phase_label"] == "COOLDOWN"


async def test_expand_module_requires_session_ownership(client):
    # User1 creates a drill, module, and session
    drill_id = await _register_and_create_drill(client)
    module_payload = {
        **MODULE_PAYLOAD,
        "drills": [{"drill_id": drill_id, "order_index": 0}],
    }
    module_id = (await client.post("/api/modules", json=module_payload)).json()["id"]
    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]

    # User2 tries to expand into User1's session
    await client.post("/api/auth/register", json=USER2)
    r = await client.post(f"/api/sessions/{session_id}/modules/{module_id}")
    assert r.status_code == 403


async def test_expand_private_module_by_non_owner_returns_403(client):
    drill_id = await _register_and_create_drill(client)
    # User1 creates a private module
    private_module_id = (
        await client.post(
            "/api/modules",
            json={
                **MODULE_PAYLOAD,
                "is_public": False,
                "drills": [{"drill_id": drill_id, "order_index": 0}],
            },
        )
    ).json()["id"]

    # User2 creates their own session, tries to expand User1's private module into it
    await client.post("/api/auth/register", json=USER2)
    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]
    r = await client.post(f"/api/sessions/{session_id}/modules/{private_module_id}")
    assert r.status_code == 403


async def test_expand_nonexistent_module_returns_404(client):
    await client.post("/api/auth/register", json=USER1)
    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]
    r = await client.post(f"/api/sessions/{session_id}/modules/nonexistent-id")
    assert r.status_code == 404


async def test_expand_module_appends_to_existing_drills(client):
    drill_id = await _register_and_create_drill(client)

    # Add one drill manually first
    session_id = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()["id"]
    await client.post(f"/api/sessions/{session_id}/drills", json={"drill_id": drill_id})

    # Create a module with one drill and expand it
    module_payload = {
        **MODULE_PAYLOAD,
        "drills": [{"drill_id": drill_id, "order_index": 0}],
    }
    module_id = (await client.post("/api/modules", json=module_payload)).json()["id"]
    r = await client.post(f"/api/sessions/{session_id}/modules/{module_id}")
    assert r.status_code == 200
    # Should now have 2 drills (original + expanded)
    assert len(r.json()["drills"]) == 2
