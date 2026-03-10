import os
import uuid

import aiofiles
from fastapi import HTTPException, UploadFile

from app.config import settings

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


async def save_upload(
    file: UploadFile,
    subfolder: str = "uploads",
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> str:
    """Save an uploaded file locally, return the URL path.

    Raises HTTP 413 if the file exceeds max_bytes.
    """
    upload_path = os.path.join(settings.upload_dir, subfolder)
    os.makedirs(upload_path, exist_ok=True)

    ext = ""
    if file.filename and "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)

    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {max_bytes // 1024 // 1024} MB.",
        )

    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    return f"/static/{subfolder}/{filename}"
