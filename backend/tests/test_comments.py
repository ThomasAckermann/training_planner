"""Integration tests for comment endpoints on drills and sessions."""

from tests.conftest import DRILL_PAYLOAD, SESSION_PAYLOAD, USER1, USER2


async def test_create_comment_on_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    r = await client.post(
        f"/api/drills/{drill['id']}/comments", json={"body": "Great drill!"}
    )
    assert r.status_code == 201
    data = r.json()
    assert data["body"] == "Great drill!"
    assert data["parent_id"] is None


async def test_create_comment_requires_auth(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    client.cookies.clear()
    r = await client.post(
        f"/api/drills/{drill['id']}/comments", json={"body": "No auth"}
    )
    assert r.status_code == 401


async def test_create_reply_to_comment(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    parent = (
        await client.post(
            f"/api/drills/{drill['id']}/comments", json={"body": "Parent"}
        )
    ).json()
    r = await client.post(
        f"/api/drills/{drill['id']}/comments",
        json={"body": "Reply", "parent_id": parent["id"]},
    )
    assert r.status_code == 201
    assert r.json()["parent_id"] == parent["id"]


async def test_list_comments_on_drill(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    await client.post(f"/api/drills/{drill['id']}/comments", json={"body": "First"})
    await client.post(f"/api/drills/{drill['id']}/comments", json={"body": "Second"})
    r = await client.get(f"/api/drills/{drill['id']}/comments")
    assert r.status_code == 200
    comments = r.json()
    assert len(comments) == 2


async def test_delete_own_comment(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    comment = (
        await client.post(
            f"/api/drills/{drill['id']}/comments", json={"body": "To delete"}
        )
    ).json()
    r = await client.delete(f"/api/comments/{comment['id']}")
    assert r.status_code == 204


async def test_delete_other_users_comment_forbidden(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    comment = (
        await client.post(
            f"/api/drills/{drill['id']}/comments", json={"body": "User1 comment"}
        )
    ).json()

    # Switch to user2
    await client.post("/api/auth/register", json=USER2)
    r = await client.delete(f"/api/comments/{comment['id']}")
    assert r.status_code == 403


async def test_drill_owner_can_delete_any_comment(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()

    # User2 posts a comment
    await client.post("/api/auth/register", json=USER2)
    comment = (
        await client.post(
            f"/api/drills/{drill['id']}/comments", json={"body": "User2 comment"}
        )
    ).json()

    # Switch back to user1 (drill owner) and delete
    await client.post(
        "/api/auth/login", json={"email": USER1["email"], "password": USER1["password"]}
    )
    r = await client.delete(f"/api/comments/{comment['id']}")
    assert r.status_code == 204


async def test_create_comment_on_session(client):
    await client.post("/api/auth/register", json=USER1)
    session = (await client.post("/api/sessions", json=SESSION_PAYLOAD)).json()
    r = await client.post(
        f"/api/sessions/{session['id']}/comments", json={"body": "Nice session!"}
    )
    assert r.status_code == 201
    assert r.json()["body"] == "Nice session!"


async def test_comment_body_max_length(client):
    await client.post("/api/auth/register", json=USER1)
    drill = (await client.post("/api/drills", json=DRILL_PAYLOAD)).json()
    long_body = "x" * 5001
    r = await client.post(
        f"/api/drills/{drill['id']}/comments", json={"body": long_body}
    )
    assert r.status_code == 422
