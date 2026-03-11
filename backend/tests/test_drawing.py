"""Integration tests for the drawing save endpoint."""

import json

from tests.conftest import DRILL_PAYLOAD, USER1, USER2

SAMPLE_DRAWING = json.dumps({"version": "1", "icons": [], "arrows": []})


async def test_save_drawing_json(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": SAMPLE_DRAWING},
    )
    assert r.status_code == 200
    assert r.json()["drawing_json"] is not None


async def test_save_drawing_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    client.cookies.clear()
    r = await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": SAMPLE_DRAWING},
    )
    assert r.status_code == 401


async def test_save_drawing_ownership_check(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()

    await client.post("/api/auth/register", json=USER2)
    r = await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": SAMPLE_DRAWING},
    )
    assert r.status_code == 403


async def test_save_drawing_invalid_json(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": "not-valid-json{{{"},
    )
    assert r.status_code == 422


async def test_save_drawing_too_large(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    # Generate a JSON string larger than 500KB
    large_drawing = json.dumps({"data": "x" * 600_000})
    r = await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": large_drawing},
    )
    assert r.status_code == 400


async def test_drawing_json_persisted_on_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    drawing = json.dumps(
        {"version": "1", "icons": [{"type": "setter", "x": 100, "y": 200}]}
    )
    await client.post(
        f"/api/drills/{drill['id']}/drawing",
        data={"drawing_json": drawing},
    )
    r = await client.get(f"/api/drills/{drill['id']}")
    assert r.status_code == 200
    assert r.json()["drawing_json"] is not None
    assert r.json()["drawing_json"]["version"] == "1"
