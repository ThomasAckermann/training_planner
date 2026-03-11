from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.limiter import limiter
from app.storage import get_storage
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional

from app.models.drill import Drill, Favourite
from app.models.follow import Follow
from app.models.session import Session
from app.models.user import User
from app.schemas.user import PublicUserOut, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB


def _validate_image_magic(content: bytes) -> bool:
    """Check actual file magic bytes to confirm the file is a real image."""
    if content[:3] == b"\xff\xd8\xff":
        return True  # JPEG
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return True  # PNG
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return True  # WebP
    if content[:6] in (b"GIF87a", b"GIF89a"):
        return True  # GIF
    return False


async def _build_public_user_out(
    db: AsyncSession,
    user: User,
    current_user: Optional[User] = None,
) -> PublicUserOut:
    follower_count_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.following_id == user.id)
    )
    follower_count = follower_count_result.scalar_one() or 0

    following_count_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.follower_id == user.id)
    )
    following_count = following_count_result.scalar_one() or 0

    is_following = False
    if current_user and current_user.id != user.id:
        follow_result = await db.execute(
            select(Follow).where(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id,
            )
        )
        is_following = follow_result.scalar_one_or_none() is not None

    return PublicUserOut(
        id=user.id,
        name=user.name,
        club=user.club,
        country=user.country,
        coaching_level=user.coaching_level,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        follower_count=follower_count,
        following_count=following_count,
        is_following=is_following,
    )


@router.get("/{user_id}", response_model=PublicUserOut)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> PublicUserOut:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return await _build_public_user_out(db, user, current_user)


@router.post("/me/avatar", response_model=UserOut)
@limiter.limit("5/minute")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be an image (JPEG, PNG, WebP, or GIF)",
        )

    content = await file.read()

    if len(content) > _MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar file too large. Maximum allowed size is 5 MB.",
        )

    if not _validate_image_magic(content):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File content does not match a valid image format.",
        )

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()

    storage = get_storage()
    url = await storage.save(
        content,
        f"avatars/{current_user.id}.{ext}",
        content_type=file.content_type or "image/jpeg",
    )
    current_user.avatar_url = url
    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/me/favourites")
async def get_my_favourites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    favs_result = await db.execute(
        select(Favourite)
        .where(Favourite.user_id == current_user.id)
        .order_by(Favourite.created_at.desc())
    )
    favs = favs_result.scalars().all()

    drill_ids = [f.drill_id for f in favs if f.drill_id]
    session_ids = [f.session_id for f in favs if f.session_id]

    drills = []
    if drill_ids:
        drills_result = await db.execute(select(Drill).where(Drill.id.in_(drill_ids)))
        drills = drills_result.scalars().all()

    sessions = []
    if session_ids:
        sessions_result = await db.execute(
            select(Session).where(Session.id.in_(session_ids))
        )
        sessions = sessions_result.scalars().all()

    return {
        "drills": [
            {
                "id": d.id,
                "title": d.title,
                "focus_area": d.focus_area,
                "skill_level": d.skill_level,
                "age_range": d.age_range,
                "duration_minutes": d.duration_minutes,
                "is_public": d.is_public,
                "user_id": d.user_id,
            }
            for d in drills
        ],
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "skill_level": s.skill_level,
                "age_range": s.age_range,
                "is_public": s.is_public,
                "user_id": s.user_id,
            }
            for s in sessions
        ],
    }


@router.post("/{user_id}/follow")
@limiter.limit("20/minute")
async def toggle_follow(
    request: Request,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing_result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        following = False
    else:
        db.add(Follow(follower_id=current_user.id, following_id=user_id))
        following = True

    await db.flush()

    follower_count_result = await db.execute(
        select(func.count(Follow.id)).where(Follow.following_id == user_id)
    )
    follower_count = follower_count_result.scalar_one() or 0

    return {"following": following, "follower_count": follower_count}


@router.get("/{user_id}/followers", response_model=list[PublicUserOut])
async def get_followers(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> list[PublicUserOut]:
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    follows_result = await db.execute(
        select(Follow).where(Follow.following_id == user_id)
    )
    follower_ids = [f.follower_id for f in follows_result.scalars().all()]

    if not follower_ids:
        return []

    users_result = await db.execute(select(User).where(User.id.in_(follower_ids)))
    users = users_result.scalars().all()
    return [await _build_public_user_out(db, u, current_user) for u in users]


@router.get("/{user_id}/following", response_model=list[PublicUserOut])
async def get_following(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> list[PublicUserOut]:
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    follows_result = await db.execute(
        select(Follow).where(Follow.follower_id == user_id)
    )
    following_ids = [f.following_id for f in follows_result.scalars().all()]

    if not following_ids:
        return []

    users_result = await db.execute(select(User).where(User.id.in_(following_ids)))
    users = users_result.scalars().all()
    return [await _build_public_user_out(db, u, current_user) for u in users]
