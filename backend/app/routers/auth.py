from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request as StarletteRequest
from starlette.responses import RedirectResponse

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.limiter import limiter
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, UserUpdate
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_auth_cookies(response: Response, user_id: str) -> None:
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    # Use secure=True in production (HTTPS only). In development, secure=False
    # allows cookies over plain HTTP.
    secure = settings.is_production

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=secure,
        max_age=settings.access_token_expire_minutes * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=secure,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(
    request: Request,
    body: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    result = await db.execute(select(User).where(User.email == body.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    _set_auth_cookies(response, user.id)
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _set_auth_cookies(response, user.id)
    return UserOut.model_validate(user)


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "logged out"}


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token",
        )

    payload = decode_token(token, settings.jwt_refresh_secret)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token({"sub": user.id})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        max_age=settings.access_token_expire_minutes * 60,
    )
    return {"message": "token refreshed"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


oauth = OAuth()
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google")
async def google_login(request: StarletteRequest):
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")
    redirect_uri = str(request.url_for("google_callback"))
    client = oauth.create_client("google")
    client.client_id = settings.google_client_id
    client.client_secret = settings.google_client_secret
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(
    request: StarletteRequest,
    db: AsyncSession = Depends(get_db),
):
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")
    client = oauth.create_client("google")
    client.client_id = settings.google_client_id
    client.client_secret = settings.google_client_secret
    token = await client.authorize_access_token(request)
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=400, detail="Failed to fetch user info from Google"
        )

    google_id = user_info["sub"]
    email = user_info.get("email", "")
    name = user_info.get("name", email.split("@")[0])

    # Try to find existing user by google_id, then by email
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link Google to existing account
            user.google_id = google_id
        else:
            # Create new user
            user = User(
                email=email,
                password_hash=None,
                name=name,
                google_id=google_id,
            )
            db.add(user)

    await db.flush()
    await db.refresh(user)

    response = RedirectResponse(url=settings.frontend_url or "/")
    _set_auth_cookies(response, str(user.id))
    return response
