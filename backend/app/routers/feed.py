from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.drill import Drill
from app.models.follow import Follow
from app.models.session import Session
from app.models.user import User
from app.routers.drills import _drill_to_out

router = APIRouter(prefix="/api/feed", tags=["feed"])


@router.get("", response_model=dict)
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return recent public drills and sessions from coaches the current user follows."""
    follows_result = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id)
    )
    following_ids = [f.following_id for f in follows_result.scalars().all()]

    if not following_ids:
        return {"drills": [], "sessions": [], "following_count": 0}

    drills_result = await db.execute(
        select(Drill)
        .where(Drill.is_public == True, Drill.user_id.in_(following_ids))  # noqa: E712
        .order_by(Drill.created_at.desc())
        .limit(limit)
        .offset((page - 1) * limit)
    )
    drills = drills_result.scalars().all()
    drill_outs = [await _drill_to_out(db, d) for d in drills]

    sessions_result = await db.execute(
        select(Session)
        .where(Session.is_public == True, Session.user_id.in_(following_ids))  # noqa: E712
        .order_by(Session.created_at.desc())
        .limit(limit)
        .offset((page - 1) * limit)
    )
    sessions = sessions_result.scalars().all()
    session_items = [
        {
            "id": s.id,
            "title": s.title,
            "skill_level": s.skill_level,
            "age_range": s.age_range,
            "user_id": s.user_id,
            "created_at": s.created_at,
        }
        for s in sessions
    ]

    return {
        "drills": [d.model_dump() for d in drill_outs],
        "sessions": session_items,
        "following_count": len(following_ids),
    }
