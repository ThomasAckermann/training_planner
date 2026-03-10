from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.comment import Comment
from app.models.drill import Drill
from app.models.session import Session
from app.models.user import User

router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    # Allow deletion by comment author or content owner
    is_author = comment.user_id == current_user.id

    is_content_owner = False
    if comment.drill_id:
        drill_result = await db.execute(
            select(Drill).where(Drill.id == comment.drill_id)
        )
        drill = drill_result.scalar_one_or_none()
        if drill and drill.user_id == current_user.id:
            is_content_owner = True
    elif comment.session_id:
        session_result = await db.execute(
            select(Session).where(Session.id == comment.session_id)
        )
        session = session_result.scalar_one_or_none()
        if session and session.user_id == current_user.id:
            is_content_owner = True

    if not is_author and not is_content_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    await db.delete(comment)
