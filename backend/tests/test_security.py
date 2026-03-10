"""Pure unit tests for app/security.py — no database required."""
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import settings


def test_hash_password_returns_bcrypt_hash():
    hashed = hash_password("mysecretpassword")
    assert hashed.startswith("$2b$")


def test_hash_password_unique_per_call():
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2  # bcrypt generates a new salt each time


def test_verify_password_correct():
    hashed = hash_password("correct_password")
    assert verify_password("correct_password", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("correct_password")
    assert verify_password("wrong_password", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token({"sub": "user-123"})
    payload = decode_token(token, settings.jwt_secret)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_create_and_decode_refresh_token():
    token = create_refresh_token({"sub": "user-456"})
    payload = decode_token(token, settings.jwt_refresh_secret)
    assert payload is not None
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"


def test_decode_token_invalid_returns_none():
    result = decode_token("not.a.valid.token", settings.jwt_secret)
    assert result is None


def test_decode_token_wrong_secret_returns_none():
    token = create_access_token({"sub": "user-789"})
    result = decode_token(token, "wrong-secret")
    assert result is None


def test_access_token_not_valid_as_refresh():
    """An access token should not be accepted when decoded with the refresh secret."""
    token = create_access_token({"sub": "user-abc"})
    # Decode with wrong secret — should return None
    result = decode_token(token, settings.jwt_refresh_secret)
    assert result is None
