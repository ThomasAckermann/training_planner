import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserOut

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


@router.get("/{user_id}", response_model=UserOut)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return UserOut.model_validate(user)


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
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

    avatar_dir = os.path.join(settings.upload_dir, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    avatar_path = os.path.join(avatar_dir, f"{current_user.id}.{ext}")
    with open(avatar_path, "wb") as f:
        f.write(content)

    current_user.avatar_url = f"/static/avatars/{current_user.id}.{ext}"
    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)
