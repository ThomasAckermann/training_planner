import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.limiter import limiter
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.drill import Favourite, Like
from app.models.module import ModuleDrill, PhaseType, TrainingModule
from app.models.user import User
from app.schemas.module import (
    ModuleCreate,
    ModuleDrillOut,
    ModuleListResponse,
    ModuleOut,
    ModuleUpdate,
)

router = APIRouter(prefix="/api/modules", tags=["modules"])


async def _module_to_out(
    module: TrainingModule,
    db: Optional[AsyncSession] = None,
    current_user: Optional[User] = None,
) -> ModuleOut:
    drills_out = []
    for md in sorted(module.drills, key=lambda x: x.order_index):
        drills_out.append(
            ModuleDrillOut(
                id=md.id,
                drill_id=md.drill_id,
                order_index=md.order_index,
                duration_override=md.duration_override,
                coach_notes=md.coach_notes,
                drill_title=md.drill.title if md.drill else None,
                drill_duration_minutes=md.drill.duration_minutes if md.drill else None,
                drill_focus_area=md.drill.focus_area if md.drill else None,
            )
        )

    likes_count = 0
    is_liked = False
    is_favourited = False

    if db is not None:
        likes_count_result = await db.execute(
            select(func.count(Like.id)).where(Like.module_id == module.id)
        )
        likes_count = likes_count_result.scalar_one() or 0

        if current_user:
            liked_result = await db.execute(
                select(Like).where(
                    Like.module_id == module.id,
                    Like.user_id == current_user.id,
                )
            )
            is_liked = liked_result.scalar_one_or_none() is not None

            fav_result = await db.execute(
                select(Favourite).where(
                    Favourite.module_id == module.id,
                    Favourite.user_id == current_user.id,
                )
            )
            is_favourited = fav_result.scalar_one_or_none() is not None

    return ModuleOut(
        id=module.id,
        user_id=module.user_id,
        title=module.title,
        phase_type=module.phase_type,
        description=module.description,
        is_public=module.is_public,
        created_at=module.created_at,
        drills=drills_out,
        likes_count=likes_count,
        is_liked=is_liked,
        is_favourited=is_favourited,
    )


@router.get("", response_model=ModuleListResponse)
async def list_modules(
    phase_type: Optional[PhaseType] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    author_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    q = select(TrainingModule).where(TrainingModule.is_public == True)  # noqa: E712
    if current_user:
        q = select(TrainingModule).where(
            (TrainingModule.user_id == current_user.id)
            | (TrainingModule.is_public == True)  # noqa: E712
        )

    if phase_type:
        q = q.where(TrainingModule.phase_type == phase_type)
    if search:
        search_term = f"%{search}%"
        q = q.where(
            TrainingModule.title.ilike(search_term)
            | TrainingModule.description.ilike(search_term)
        )
    if author_id:
        q = q.where(TrainingModule.user_id == author_id)

    count_query = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if sort_by == "most_liked":
        likes_subq = (
            select(Like.module_id, func.count(Like.id).label("likes_count"))
            .where(Like.module_id.isnot(None))
            .group_by(Like.module_id)
            .subquery()
        )
        q = q.outerjoin(likes_subq, TrainingModule.id == likes_subq.c.module_id)
        q = q.order_by(func.coalesce(likes_subq.c.likes_count, 0).desc())
    else:
        q = q.order_by(TrainingModule.created_at.desc())

    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    modules = result.scalars().all()

    out = []
    for m in modules:
        await db.refresh(m, ["drills"])
        for md in m.drills:
            await db.refresh(md, ["drill"])
        out.append(await _module_to_out(m, db, current_user))

    pages = math.ceil(total / limit) if total > 0 else 1
    return ModuleListResponse(
        items=out, total=total, page=page, limit=limit, pages=pages
    )


@router.get("/mine", response_model=list[ModuleOut])
async def get_my_modules(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingModule)
        .where(TrainingModule.user_id == current_user.id)
        .order_by(TrainingModule.created_at.desc())
    )
    modules = result.scalars().all()
    out = []
    for m in modules:
        await db.refresh(m, ["drills"])
        for md in m.drills:
            await db.refresh(md, ["drill"])
        out.append(await _module_to_out(m, db, current_user))
    return out


@router.post("", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_module(
    request: Request,
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    module = TrainingModule(
        user_id=current_user.id,
        title=data.title,
        phase_type=data.phase_type,
        description=data.description,
        is_public=data.is_public,
    )
    db.add(module)
    await db.flush()

    for i, d in enumerate(data.drills):
        db.add(
            ModuleDrill(
                module_id=module.id,
                drill_id=d.drill_id,
                order_index=d.order_index if d.order_index else i,
                duration_override=d.duration_override,
                coach_notes=d.coach_notes,
            )
        )

    await db.flush()
    await db.refresh(module, ["drills"])
    for md in module.drills:
        await db.refresh(md, ["drill"])
    return await _module_to_out(module, db, current_user)


@router.get("/{module_id}", response_model=ModuleOut)
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if not module.is_public and (not current_user or module.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.refresh(module, ["drills"])
    for md in module.drills:
        await db.refresh(md, ["drill"])
    return await _module_to_out(module, db, current_user)


@router.patch("/{module_id}", response_model=ModuleOut)
@limiter.limit("20/minute")
async def update_module(
    request: Request,
    module_id: str,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if module.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.title is not None:
        module.title = data.title
    if data.phase_type is not None:
        module.phase_type = data.phase_type
    if data.description is not None:
        module.description = data.description
    if data.is_public is not None:
        module.is_public = data.is_public

    if data.drills is not None:
        existing = await db.execute(
            select(ModuleDrill).where(ModuleDrill.module_id == module_id)
        )
        for md in existing.scalars().all():
            await db.delete(md)
        for i, d in enumerate(data.drills):
            db.add(
                ModuleDrill(
                    module_id=module.id,
                    drill_id=d.drill_id,
                    order_index=d.order_index if d.order_index else i,
                    duration_override=d.duration_override,
                    coach_notes=d.coach_notes,
                )
            )

    db.add(module)
    await db.flush()
    await db.refresh(module, ["drills"])
    for md in module.drills:
        await db.refresh(md, ["drill"])
    return await _module_to_out(module, db, current_user)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
async def delete_module(
    request: Request,
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if module.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(module)
    await db.flush()


@router.post("/{module_id}/like")
@limiter.limit("20/minute")
async def toggle_like_module(
    request: Request,
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing_result = await db.execute(
        select(Like).where(
            Like.module_id == module_id,
            Like.user_id == current_user.id,
        )
    )
    existing_like = existing_result.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        return {"liked": False}
    else:
        like = Like(user_id=current_user.id, module_id=module_id)
        db.add(like)
        return {"liked": True}


@router.post("/{module_id}/favourite")
@limiter.limit("20/minute")
async def toggle_favourite_module(
    request: Request,
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing_result = await db.execute(
        select(Favourite).where(
            Favourite.module_id == module_id,
            Favourite.user_id == current_user.id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        return {"favourited": False}
    else:
        fav = Favourite(user_id=current_user.id, module_id=module_id)
        db.add(fav)
        return {"favourited": True}
