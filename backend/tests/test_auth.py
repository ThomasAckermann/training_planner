"""Integration tests for /api/auth endpoints."""
import pytest

from tests.conftest import USER1, USER2


async def test_register_creates_user_and_sets_cookies(client):
    r = await client.post("/api/auth/register", json=USER1)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == USER1["email"]
    assert data["name"] == USER1["name"]
    assert "password" not in data
    assert "access_token" in r.cookies
    assert "refresh_token" in r.cookies


async def test_register_duplicate_email_returns_409(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.post("/api/auth/register", json=USER1)
    assert r.status_code == 409


async def test_login_valid_credentials(client):
    await client.post("/api/auth/register", json=USER1)
    # Clear cookies to simulate a fresh login
    client.cookies.clear()
    r = await client.post("/api/auth/login", json={"email": USER1["email"], "password": USER1["password"]})
    assert r.status_code == 200
    assert "access_token" in r.cookies
    assert "refresh_token" in r.cookies


async def test_login_wrong_password_returns_401(client):
    await client.post("/api/auth/register", json=USER1)
    client.cookies.clear()
    r = await client.post("/api/auth/login", json={"email": USER1["email"], "password": "wrongpass"})
    assert r.status_code == 401


async def test_login_unknown_email_returns_401(client):
    r = await client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "pass"})
    assert r.status_code == 401


async def test_me_requires_auth(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


async def test_me_returns_current_user(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == USER1["email"]


async def test_logout_clears_cookies(client):
    await client.post("/api/auth/register", json=USER1)
    assert "access_token" in client.cookies
    r = await client.post("/api/auth/logout")
    assert r.status_code == 200
    # After logout, /me should return 401
    r2 = await client.get("/api/auth/me")
    assert r2.status_code == 401


async def test_refresh_with_valid_refresh_token(client):
    await client.post("/api/auth/register", json=USER1)
    # Remove access token to simulate expiry
    client.cookies.delete("access_token")
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    assert "access_token" in r.cookies


async def test_refresh_without_token_returns_401(client):
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_update_me_profile(client):
    await client.post("/api/auth/register", json=USER1)
    r = await client.patch("/api/auth/me", json={"club": "Volleyball Club Berlin", "country": "DE"})
    assert r.status_code == 200
    data = r.json()
    assert data["club"] == "Volleyball Club Berlin"
    assert data["country"] == "DE"
