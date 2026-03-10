import os

from fastapi import Request
from slowapi import Limiter


def _get_client_ip(request: Request) -> str:
    # In tests (TESTING=1 env var), return a unique key per request to avoid
    # accumulating rate limit counts across test functions.
    if os.getenv("TESTING"):
        import uuid

        return str(uuid.uuid4())
    # In production behind Railway's proxy, use X-Forwarded-For header.
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=_get_client_ip)
