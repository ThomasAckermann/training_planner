import json
import math
import os
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.drill import AgeRange, Drill, FocusArea, Favourite, Like, SkillLevel
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.session import DrillSession
from app.models.user import User
from app.schemas.drill import (
    DrillAnalyticsOut,
    DrillCreate,
    DrillListResponse,
    DrillOut,
    DrillUpdate,
)
from app.schemas.comment import CommentAuthor, CommentCreate, CommentOut

router = APIRouter(prefix="/api/drills", tags=["drills"])


async def _get_likes_count(db: AsyncSession, drill_id: str) -> int:
    result = await db.execute(
        select(func.count(Like.id)).where(Like.drill_id == drill_id)
    )
    return result.scalar_one() or 0


async def _get_rating_stats(
    db: AsyncSession, drill_id: str
) -> tuple[float | None, int]:
    result = await db.execute(
        select(func.avg(Rating.score), func.count(Rating.id)).where(
            Rating.drill_id == drill_id
        )
    )
    row = result.one()
    avg = float(round(row[0], 2)) if row[0] is not None else None
    count = row[1] or 0
    return avg, count


async def _drill_to_out(db: AsyncSession, drill: Drill) -> DrillOut:
    likes_count = await _get_likes_count(db, drill.id)
    avg_rating, rating_count = await _get_rating_stats(db, drill.id)
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
        "avg_rating": avg_rating,
        "rating_count": rating_count,
        "view_count": drill.view_count,
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

    return DrillListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


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

    return DrillListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


@router.get("/analytics", response_model=list[DrillAnalyticsOut])
async def get_drill_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DrillAnalyticsOut]:
    result = await db.execute(
        select(Drill)
        .where(Drill.user_id == current_user.id)
        .order_by(Drill.created_at.desc())
    )
    drills = result.scalars().all()

    analytics = []
    for drill in drills:
        likes_count = await _get_likes_count(db, drill.id)
        avg_rating, rating_count = await _get_rating_stats(db, drill.id)
        session_count_result = await db.execute(
            select(func.count(DrillSession.id)).where(DrillSession.drill_id == drill.id)
        )
        session_count = session_count_result.scalar_one() or 0
        analytics.append(
            DrillAnalyticsOut(
                id=drill.id,
                title=drill.title,
                view_count=drill.view_count,
                likes_count=likes_count,
                avg_rating=avg_rating,
                rating_count=rating_count,
                session_count=session_count,
            )
        )
    return analytics


@router.get("/{drill_id}", response_model=DrillOut)
async def get_drill(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> DrillOut:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    if not drill.is_public:
        if not current_user or drill.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    drill.view_count = (drill.view_count or 0) + 1
    db.add(drill)

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    if drill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    try:
        drill.drawing_json = json.loads(drawing_json)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid drawing JSON",
        )

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


@router.post("/{drill_id}/favourite")
async def toggle_favourite_drill(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    existing_result = await db.execute(
        select(Favourite).where(
            Favourite.drill_id == drill_id,
            Favourite.user_id == current_user.id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        return {"favourited": False}
    else:
        fav = Favourite(user_id=current_user.id, drill_id=drill_id)
        db.add(fav)
        return {"favourited": True}


@router.post("/{drill_id}/rate")
async def rate_drill(
    drill_id: str,
    score: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if score < 1 or score > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Score must be between 1 and 5",
        )

    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    existing_result = await db.execute(
        select(Rating).where(
            Rating.drill_id == drill_id, Rating.user_id == current_user.id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.score = score
        db.add(existing)
    else:
        db.add(Rating(user_id=current_user.id, drill_id=drill_id, score=score))

    await db.flush()

    avg_rating, rating_count = await _get_rating_stats(db, drill_id)
    return {"avg_rating": avg_rating, "rating_count": rating_count, "user_score": score}


async def _comment_to_out(db: AsyncSession, comment: Comment) -> CommentOut:
    user_result = await db.execute(select(User).where(User.id == comment.user_id))
    user = user_result.scalar_one_or_none()
    author = (
        CommentAuthor(id=user.id, name=user.name, avatar_url=user.avatar_url)
        if user
        else CommentAuthor(id=comment.user_id, name="Unknown")
    )

    replies_result = await db.execute(
        select(Comment)
        .where(Comment.parent_id == comment.id)
        .order_by(Comment.created_at.asc())
    )
    replies = [await _comment_to_out(db, r) for r in replies_result.scalars().all()]

    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        drill_id=comment.drill_id,
        session_id=comment.session_id,
        parent_id=comment.parent_id,
        body=comment.body,
        created_at=comment.created_at,
        author=author,
        replies=replies,
    )


@router.get("/{drill_id}/comments", response_model=list[CommentOut])
async def list_drill_comments(
    drill_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[CommentOut]:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    comments_result = await db.execute(
        select(Comment)
        .where(Comment.drill_id == drill_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.asc())
    )
    return [await _comment_to_out(db, c) for c in comments_result.scalars().all()]


@router.post(
    "/{drill_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_drill_comment(
    drill_id: str,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentOut:
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    comment = Comment(
        user_id=current_user.id,
        drill_id=drill_id,
        parent_id=body.parent_id,
        body=body.body,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return await _comment_to_out(db, comment)
