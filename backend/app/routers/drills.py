import json
import math
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.drill import AgeRange, Drill, FocusArea, Like, SkillLevel
from app.models.user import User
from app.schemas.drill import DrillCreate, DrillListResponse, DrillOut, DrillUpdate

router = APIRouter(prefix="/api/drills", tags=["drills"])


async def _get_likes_count(db: AsyncSession, drill_id: str) -> int:
    result = await db.execute(
        select(func.count(Like.id)).where(Like.drill_id == drill_id)
    )
    return result.scalar_one() or 0


async def _drill_to_out(db: AsyncSession, drill: Drill) -> DrillOut:
    likes_count = await _get_likes_count(db, drill.id)
    data = {
        "id": drill.id,
        "title": drill.title,
        "description": drill.description,
        "duration_minutes": drill.duration_minutes,
        "num_players_min": drill.num_players_min,
        "num_players_max": drill.num_players_max,
        "equipment": drill.equipment,
        "skill_tags": drill.skill_tags,
        "age_range": drill.age_range,
        "skill_level": drill.skill_level,
        "focus_area": drill.focus_area,
        "drawing_json": drill.drawing_json,
        "drawing_thumb_url": drill.drawing_thumb_url,
        "video_url": drill.video_url,
        "is_public": drill.is_public,
        "user_id": drill.user_id,
        "created_at": drill.created_at,
        "updated_at": drill.updated_at,
        "likes_count": likes_count,
    }
    return DrillOut(**data)


@router.get("", response_model=DrillListResponse)
async def list_drills(
    search: Optional[str] = Query(None),
    age_range: Optional[AgeRange] = Query(None),
    skill_level: Optional[SkillLevel] = Query(None),
    focus_area: Optional[FocusArea] = Query(None),
    author_id: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> DrillListResponse:
    query = select(Drill).where(Drill.is_public == True)  # noqa: E712

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Drill.title.ilike(search_term) | Drill.description.ilike(search_term)
        )
    if age_range:
        query = query.where(Drill.age_range == age_range)
    if skill_level:
        query = query.where(Drill.skill_level == skill_level)
    if focus_area:
        query = query.where(Drill.focus_area == focus_area)
    if author_id:
        query = query.where(Drill.user_id == author_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if sort_by == "most_liked":
        likes_subq = (
            select(Like.drill_id, func.count(Like.id).label("likes_count"))
            .group_by(Like.drill_id)
            .subquery()
        )
        query = query.outerjoin(likes_subq, Drill.id == likes_subq.c.drill_id)
        query = query.order_by(func.coalesce(likes_subq.c.likes_count, 0).desc())
    else:
        query = query.order_by(Drill.created_at.desc())

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    drills = result.scalars().all()

    items = [await _drill_to_out(db, d) for d in drills]
    pages = math.ceil(total / limit) if total > 0 else 1

    return DrillListResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get("/mine", response_model=DrillListResponse)
async def list_my_drills(
    search: Optional[str] = Query(None),
    age_range: Optional[AgeRange] = Query(None),
    skill_level: Optional[SkillLevel] = Query(None),
    focus_area: Optional[FocusArea] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillListResponse:
    query = select(Drill).where(Drill.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Drill.title.ilike(search_term) | Drill.description.ilike(search_term)
        )
    if age_range:
        query = query.where(Drill.age_range == age_range)
    if skill_level:
        query = query.where(Drill.skill_level == skill_level)
    if focus_area:
        query = query.where(Drill.focus_area == focus_area)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Drill.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    drills = result.scalars().all()

    items = [await _drill_to_out(db, d) for d in drills]
    pages = math.ceil(total / limit) if total > 0 else 1

    return DrillListResponse(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get("/{drill_id}", response_model=DrillOut)
async def get_drill(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> DrillOut:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found")

    if not drill.is_public:
        if not current_user or drill.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return await _drill_to_out(db, drill)


@router.post("", response_model=DrillOut, status_code=status.HTTP_201_CREATED)
async def create_drill(
    body: DrillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillOut:
    drill = Drill(
        title=body.title,
        description=body.description,
        duration_minutes=body.duration_minutes,
        num_players_min=body.num_players_min,
        num_players_max=body.num_players_max,
        equipment=body.equipment or [],
        skill_tags=body.skill_tags or [],
        age_range=body.age_range,
        skill_level=body.skill_level,
        focus_area=body.focus_area,
        video_url=body.video_url,
        is_public=body.is_public,
        user_id=current_user.id,
    )
    db.add(drill)
    await db.flush()
    await db.refresh(drill)
    return await _drill_to_out(db, drill)


@router.patch("/{drill_id}", response_model=DrillOut)
async def update_drill(
    drill_id: str,
    body: DrillUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillOut:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found")

    if drill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this drill",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(drill, field, value)

    db.add(drill)
    await db.flush()
    await db.refresh(drill)
    return await _drill_to_out(db, drill)


@router.delete("/{drill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drill(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found")

    if drill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this drill",
        )

    # Delete associated likes first
    likes_result = await db.execute(select(Like).where(Like.drill_id == drill_id))
    for like in likes_result.scalars().all():
        await db.delete(like)

    await db.delete(drill)


@router.post("/{drill_id}/like")
async def toggle_like(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found")

    existing_result = await db.execute(
        select(Like).where(
            Like.drill_id == drill_id,
            Like.user_id == current_user.id,
        )
    )
    existing_like = existing_result.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        return {"liked": False}
    else:
        like = Like(user_id=current_user.id, drill_id=drill_id)
        db.add(like)
        return {"liked": True}


@router.post("/{drill_id}/drawing", response_model=DrillOut)
async def save_drawing(
    drill_id: str,
    drawing_json: str = Form(...),
    thumbnail: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrillOut:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found")

    if drill.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    try:
        drill.drawing_json = json.loads(drawing_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid drawing JSON")

    if thumbnail:
        thumb_dir = os.path.join(settings.upload_dir, "thumbnails")
        os.makedirs(thumb_dir, exist_ok=True)
        thumb_path = os.path.join(thumb_dir, f"{drill_id}.png")
        content = await thumbnail.read()
        with open(thumb_path, "wb") as f:
            f.write(content)
        drill.drawing_thumb_url = f"/static/thumbnails/{drill_id}.png"

    db.add(drill)
    await db.flush()
    await db.refresh(drill)
    return await _drill_to_out(db, drill)
