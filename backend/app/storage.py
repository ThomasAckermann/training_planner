import os
import uuid

import aiofiles
from fastapi import UploadFile

from app.config import settings


async def save_upload(file: UploadFile, subfolder: str = "uploads") -> str:
    """Save an uploaded file locally, return the URL path."""
    upload_path = os.path.join(settings.upload_dir, subfolder)
    os.makedirs(upload_path, exist_ok=True)

    ext = ""
    if file.filename and "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    return f"/static/{subfolder}/{filename}"
