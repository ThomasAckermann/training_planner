import base64
import math
import os
from datetime import date
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from fpdf import FPDF
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.drill import AgeRange, Drill, Like, SkillLevel
from app.models.session import DrillSession, Session
from app.models.user import User
from app.schemas.session import (
    AddDrillToSession,
    ReorderDrills,
    SessionCreate,
    SessionListResponse,
    SessionOut,
    SessionUpdate,
    UpdateDrillInSession,
    DrillInSession,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


async def _session_to_out(db: AsyncSession, session: Session) -> SessionOut:
    # Load drill_sessions joined with drills in a single query
    result = await db.execute(
        select(DrillSession, Drill)
        .join(Drill, DrillSession.drill_id == Drill.id)
        .where(DrillSession.session_id == session.id)
        .order_by(DrillSession.order_index)
    )
    rows = result.all()

    drills_in_session = []
    total_duration = 0

    for ds, drill in rows:
        # Get likes count for each drill
        likes_result = await db.execute(
            select(func.count(Like.id)).where(Like.drill_id == drill.id)
        )
        drill_likes_count = likes_result.scalar_one() or 0

        effective_duration = (
            ds.duration_override
            if ds.duration_override is not None
            else (drill.duration_minutes or 0)
        )
        total_duration += effective_duration

        drills_in_session.append(
            DrillInSession(
                drill_session_id=ds.id,
                order_index=ds.order_index,
                duration_override=ds.duration_override,
                coach_notes=ds.coach_notes,
                id=drill.id,
                title=drill.title,
                description=drill.description,
                duration_minutes=drill.duration_minutes,
                num_players_min=drill.num_players_min,
                num_players_max=drill.num_players_max,
                equipment=drill.equipment,
                skill_tags=drill.skill_tags,
                age_range=drill.age_range,
                skill_level=drill.skill_level,
                focus_area=drill.focus_area,
                drawing_json=drill.drawing_json,
                drawing_thumb_url=drill.drawing_thumb_url,
                video_url=drill.video_url,
                is_public=drill.is_public,
                user_id=drill.user_id,
                created_at=drill.created_at,
                updated_at=drill.updated_at,
                likes_count=drill_likes_count,
            )
        )

    # Count session likes
    likes_result = await db.execute(
        select(func.count(Like.id)).where(Like.session_id == session.id)
    )
    likes_count = likes_result.scalar_one() or 0

    return SessionOut(
        id=session.id,
        title=session.title,
        description=session.description,
        age_range=session.age_range,
        skill_level=session.skill_level,
        focus_areas=session.focus_areas,
        team_size=session.team_size,
        is_public=session.is_public,
        tags=session.tags,
        user_id=session.user_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        drills=drills_in_session,
        total_duration_minutes=total_duration,
        likes_count=likes_count,
    )


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    search: Optional[str] = Query(None),
    age_range: Optional[AgeRange] = Query(None),
    skill_level: Optional[SkillLevel] = Query(None),
    author_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> SessionListResponse:
    query = select(Session).where(Session.is_public == True)  # noqa: E712

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Session.title.ilike(search_term) | Session.description.ilike(search_term)
        )
    if age_range:
        query = query.where(Session.age_range == age_range)
    if skill_level:
        query = query.where(Session.skill_level == skill_level)
    if author_id:
        query = query.where(Session.user_id == author_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Session.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()

    items = [await _session_to_out(db, s) for s in sessions]
    pages = math.ceil(total / limit) if total > 0 else 1

    return SessionListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


@router.get("/mine", response_model=SessionListResponse)
async def list_my_sessions(
    search: Optional[str] = Query(None),
    age_range: Optional[AgeRange] = Query(None),
    skill_level: Optional[SkillLevel] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionListResponse:
    query = select(Session).where(Session.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Session.title.ilike(search_term) | Session.description.ilike(search_term)
        )
    if age_range:
        query = query.where(Session.age_range == age_range)
    if skill_level:
        query = query.where(Session.skill_level == skill_level)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Session.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()

    items = [await _session_to_out(db, s) for s in sessions]
    pages = math.ceil(total / limit) if total > 0 else 1

    return SessionListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if not session.is_public:
        if not current_user or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    return await _session_to_out(db, session)


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    session = Session(
        title=body.title,
        description=body.description,
        age_range=body.age_range,
        skill_level=body.skill_level,
        focus_areas=body.focus_areas or [],
        team_size=body.team_size,
        is_public=body.is_public,
        tags=body.tags or [],
        user_id=current_user.id,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return await _session_to_out(db, session)


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: str,
    body: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    db.add(session)
    await db.flush()
    await db.refresh(session)
    return await _session_to_out(db, session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Delete associated likes first
    likes_result = await db.execute(select(Like).where(Like.session_id == session_id))
    for like in likes_result.scalars().all():
        await db.delete(like)

    await db.delete(session)


@router.post(
    "/{session_id}/duplicate",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
async def duplicate_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if not original.is_public and original.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    new_session = Session(
        title=f"[Copy] {original.title}",
        description=original.description,
        age_range=original.age_range,
        skill_level=original.skill_level,
        focus_areas=list(original.focus_areas or []),
        team_size=original.team_size,
        is_public=False,
        tags=list(original.tags or []),
        user_id=current_user.id,
    )
    db.add(new_session)
    await db.flush()
    await db.refresh(new_session)

    # Copy drill sessions
    ds_result = await db.execute(
        select(DrillSession)
        .where(DrillSession.session_id == session_id)
        .order_by(DrillSession.order_index)
    )
    for ds in ds_result.scalars().all():
        new_ds = DrillSession(
            drill_id=ds.drill_id,
            session_id=new_session.id,
            order_index=ds.order_index,
            duration_override=ds.duration_override,
            coach_notes=ds.coach_notes,
        )
        db.add(new_ds)

    await db.flush()
    return await _session_to_out(db, new_session)


@router.post("/{session_id}/like")
async def toggle_like_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    existing_result = await db.execute(
        select(Like).where(
            Like.session_id == session_id,
            Like.user_id == current_user.id,
        )
    )
    existing_like = existing_result.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        return {"liked": False}
    else:
        like = Like(user_id=current_user.id, session_id=session_id)
        db.add(like)
        return {"liked": True}


@router.post("/{session_id}/drills", response_model=SessionOut)
async def add_drill_to_session(
    session_id: str,
    body: AddDrillToSession,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check drill exists
    drill_result = await db.execute(select(Drill).where(Drill.id == body.drill_id))
    drill = drill_result.scalar_one_or_none()
    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    # Get max order_index
    max_result = await db.execute(
        select(func.max(DrillSession.order_index)).where(
            DrillSession.session_id == session_id
        )
    )
    max_index = max_result.scalar_one()
    next_index = (max_index + 1) if max_index is not None else 0

    drill_session = DrillSession(
        drill_id=body.drill_id,
        session_id=session_id,
        order_index=next_index,
        duration_override=body.duration_override,
        coach_notes=body.coach_notes,
    )
    db.add(drill_session)
    await db.flush()

    return await _session_to_out(db, session)


@router.patch("/{session_id}/drills", response_model=SessionOut)
async def reorder_drills(
    session_id: str,
    body: ReorderDrills,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    for index, ds_id in enumerate(body.drill_session_ids):
        ds_result = await db.execute(
            select(DrillSession).where(
                DrillSession.id == ds_id,
                DrillSession.session_id == session_id,
            )
        )
        ds = ds_result.scalar_one_or_none()
        if ds:
            ds.order_index = index
            db.add(ds)

    await db.flush()
    return await _session_to_out(db, session)


@router.patch("/{session_id}/drills/{drill_session_id}", response_model=SessionOut)
async def update_drill_in_session(
    session_id: str,
    drill_session_id: str,
    body: UpdateDrillInSession,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    ds_result = await db.execute(
        select(DrillSession).where(
            DrillSession.id == drill_session_id,
            DrillSession.session_id == session_id,
        )
    )
    ds = ds_result.scalar_one_or_none()

    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill session not found"
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ds, field, value)

    db.add(ds)
    await db.flush()
    return await _session_to_out(db, session)


@router.delete("/{session_id}/drills/{drill_session_id}", response_model=SessionOut)
async def remove_drill_from_session(
    session_id: str,
    drill_session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionOut:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    ds_result = await db.execute(
        select(DrillSession).where(
            DrillSession.id == drill_session_id,
            DrillSession.session_id == session_id,
        )
    )
    ds = ds_result.scalar_one_or_none()

    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill session not found"
        )

    await db.delete(ds)
    await db.flush()

    # Re-index remaining drill_sessions
    remaining_result = await db.execute(
        select(DrillSession)
        .where(DrillSession.session_id == session_id)
        .order_by(DrillSession.order_index)
    )
    remaining = remaining_result.scalars().all()
    for i, remaining_ds in enumerate(remaining):
        remaining_ds.order_index = i
        db.add(remaining_ds)

    await db.flush()
    return await _session_to_out(db, session)


class _SessionPDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(170, 170, 170)
        self.cell(
            0, 10, f"Generated with VC Planner  |  Page {self.page_no()}", align="C"
        )


def _build_pdf(session_out, creator, drills_with_images) -> bytes:
    pdf = _SessionPDF(format="A4")
    pdf.set_margins(15, 18, 15)
    pdf.set_auto_page_break(auto=True, margin=22)
    pdf.add_page()

    # ── Header ────────────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(26, 26, 46)
    pdf.multi_cell(0, 10, session_out.title.upper(), align="L")
    pdf.ln(1)

    meta_parts = []
    if creator:
        meta_parts.append(creator.name)
        if creator.club:
            meta_parts.append(creator.club)
    meta_parts.append(date.today().strftime("%B %d, %Y"))
    if session_out.total_duration_minutes > 0:
        meta_parts.append(f"{session_out.total_duration_minutes} min total")
    if session_out.team_size:
        meta_parts.append(f"{session_out.team_size} players")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(85, 85, 85)
    pdf.cell(0, 6, "  |  ".join(meta_parts))
    pdf.ln(5)

    if session_out.skill_level or session_out.age_range:
        badges = []
        if session_out.skill_level:
            badges.append(str(session_out.skill_level.value))
        if session_out.age_range:
            badges.append(str(session_out.age_range.value))
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(26, 100, 168)
        pdf.cell(0, 5, "  ".join(badges))
        pdf.ln(4)

    pdf.set_draw_color(26, 26, 46)
    pdf.set_line_width(0.8)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(5)

    if session_out.description:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(68, 68, 68)
        pdf.multi_cell(0, 5, session_out.description)
        pdf.ln(5)

    # ── Section title ─────────────────────────────────────────────────────────
    n = len(drills_with_images)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(136, 136, 136)
    pdf.cell(0, 5, f"TRAINING PROGRAM -- {n} DRILL{'S' if n != 1 else ''}")
    pdf.ln(2)
    pdf.set_draw_color(200, 200, 200)
    pdf.set_line_width(0.3)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(6)

    # ── Drills ────────────────────────────────────────────────────────────────
    for i, item in enumerate(drills_with_images):
        drill = item["drill"]
        thumb_b64 = item["thumb_b64"]
        eff_dur = drill.duration_override or drill.duration_minutes

        y_start = pdf.get_y()

        # Drill number + title + duration
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(153, 153, 153)
        pdf.cell(8, 7, f"{i + 1}.")

        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(26, 26, 46)
        dur_w = 25 if eff_dur else 0
        pdf.cell(180 - 8 - dur_w, 7, drill.title)

        if eff_dur:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(180, 130, 0)
            pdf.cell(dur_w, 7, f"{eff_dur} min", align="R")
        pdf.ln(7)

        # Meta: focus area, players
        meta_bits = []
        if drill.focus_area:
            meta_bits.append(str(drill.focus_area))
        if drill.num_players_min or drill.num_players_max:
            if drill.num_players_min and drill.num_players_max:
                meta_bits.append(
                    f"Players: {drill.num_players_min}-{drill.num_players_max}"
                )
            elif drill.num_players_min:
                meta_bits.append(f"Players: {drill.num_players_min}+")
            else:
                meta_bits.append(f"Players: up to {drill.num_players_max}")
        if meta_bits:
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(102, 102, 102)
            pdf.cell(0, 5, "  |  ".join(meta_bits))
            pdf.ln(5)

        # Thumbnail
        if thumb_b64:
            try:
                img_bytes = base64.b64decode(thumb_b64)
                pdf.image(BytesIO(img_bytes), w=150)
                pdf.ln(3)
            except Exception:
                pass

        # Description
        if drill.description:
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(51, 51, 51)
            pdf.multi_cell(0, 5, drill.description)
            pdf.ln(2)

        # Coach notes
        if drill.coach_notes:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(51, 51, 51)
            pdf.multi_cell(0, 5, f"Coach notes: {drill.coach_notes}")
            pdf.ln(2)

        # Left accent bar
        y_end = pdf.get_y()
        pdf.set_draw_color(204, 20, 20)
        pdf.set_line_width(1.5)
        pdf.line(13, y_start, 13, y_end)

        # Separator between drills
        if i < len(drills_with_images) - 1:
            pdf.set_draw_color(220, 220, 220)
            pdf.set_line_width(0.3)
            pdf.line(15, pdf.get_y() + 3, 195, pdf.get_y() + 3)
            pdf.ln(8)

    return bytes(pdf.output())


@router.get("/{session_id}/export/pdf")
async def export_session_pdf(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Response:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if not session.is_public:
        if not current_user or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

    user_result = await db.execute(select(User).where(User.id == session.user_id))
    creator = user_result.scalar_one_or_none()

    session_out = await _session_to_out(db, session)

    drills_with_images = []
    for drill in session_out.drills:
        thumb_b64 = None
        if drill.drawing_thumb_url:
            rel = drill.drawing_thumb_url.removeprefix("/static/")
            full_path = os.path.join(settings.upload_dir, rel)
            if os.path.exists(full_path):
                with open(full_path, "rb") as f:
                    thumb_b64 = base64.b64encode(f.read()).decode()
        drills_with_images.append({"drill": drill, "thumb_b64": thumb_b64})

    pdf_bytes = _build_pdf(session_out, creator, drills_with_images)
    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in session.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'},
    )
