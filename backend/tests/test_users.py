"""Integration tests for /api/users endpoints."""
import io

from tests.conftest import USER1


async def test_get_public_profile(client):
    r = await client.post("/api/auth/register", json=USER1)
    user_id = r.json()["id"]

    client.cookies.clear()
    r = await client.get(f"/api/users/{user_id}")
    assert r.status_code == 200
    assert r.json()["name"] == USER1["name"]


async def test_get_nonexistent_user_returns_404(client):
    r = await client.get("/api/users/does-not-exist")
    assert r.status_code == 404


async def test_avatar_upload_requires_auth(client):
    png_bytes = (
        b"\x89PNG\r\n\x1a\n"
        + b"\x00" * 100  # minimal fake PNG body
    )
    r = await client.post(
        "/api/users/me/avatar",
        files={"file": ("avatar.png", io.BytesIO(png_bytes), "image/png")},
    )
    assert r.status_code == 401


async def test_avatar_upload_invalid_content_type(client):
    await client.post("/api/auth/register", json=USER1)
    fake_file = io.BytesIO(b"this is not an image")
    r = await client.post(
        "/api/users/me/avatar",
        files={"file": ("malware.exe", fake_file, "application/octet-stream")},
    )
    assert r.status_code == 422


async def test_avatar_upload_spoofed_content_type_rejected(client):
    """A file with a valid content-type header but non-image content should be rejected."""
    await client.post("/api/auth/register", json=USER1)
    # Claim it's a PNG but send garbage content
    fake_file = io.BytesIO(b"not a real png file contents here")
    r = await client.post(
        "/api/users/me/avatar",
        files={"file": ("fake.png", fake_file, "image/png")},
    )
    assert r.status_code == 422


async def test_avatar_upload_valid_png(client):
    await client.post("/api/auth/register", json=USER1)
    # Minimal valid PNG magic bytes followed by padding
    png_magic = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    r = await client.post(
        "/api/users/me/avatar",
        files={"file": ("avatar.png", io.BytesIO(png_magic), "image/png")},
    )
    assert r.status_code == 200
    assert r.json()["avatar_url"] is not None


async def test_avatar_upload_valid_jpeg(client):
    await client.post("/api/auth/register", json=USER1)
    # JPEG magic bytes
    jpeg_magic = b"\xff\xd8\xff\xe0" + b"\x00" * 50
    r = await client.post(
        "/api/users/me/avatar",
        files={"file": ("avatar.jpg", io.BytesIO(jpeg_magic), "image/jpeg")},
    )
    assert r.status_code == 200
