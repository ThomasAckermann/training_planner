"""
Storage service abstraction — swaps between local filesystem (dev) and AWS S3 (prod).

Usage:
  storage = get_storage()
  url = await storage.save(content_bytes, "avatars/user123.jpg", "image/jpeg")
  await storage.delete("avatars/user123.jpg")

Select backend via STORAGE_BACKEND env var: "local" (default) or "s3".
S3 also requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION.
"""

import abc
import asyncio
import os
from typing import Optional


class StorageService(abc.ABC):
    @abc.abstractmethod
    async def save(
        self,
        content: bytes,
        path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Persist *content* at *path* and return the public URL."""
        ...

    @abc.abstractmethod
    async def delete(self, path: str) -> None:
        """Delete the file at *path* (no-op if it does not exist)."""
        ...


class LocalStorage(StorageService):
    """Saves files to the local upload directory; serves via /static/*."""

    def __init__(self, upload_dir: str) -> None:
        self.upload_dir = upload_dir

    async def save(
        self,
        content: bytes,
        path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        full_path = os.path.join(self.upload_dir, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as fh:
            fh.write(content)
        return f"/static/{path}"

    async def delete(self, path: str) -> None:
        full_path = os.path.join(self.upload_dir, path)
        if os.path.exists(full_path):
            os.remove(full_path)


class S3Storage(StorageService):
    """Uploads files to an S3-compatible bucket; returns a public HTTPS URL.

    Works with AWS S3 (no endpoint_url) and S3-compatible providers such as
    Railway Object Storage, Cloudflare R2, MinIO, etc. (pass endpoint_url).
    """

    def __init__(
        self,
        bucket: str,
        region: str,
        access_key: str,
        secret_key: str,
        endpoint_url: Optional[str] = None,
    ) -> None:
        import boto3  # imported lazily so boto3 is optional in dev

        self.bucket = bucket
        self.region = region
        self._endpoint_url = endpoint_url
        self._client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            **({"endpoint_url": endpoint_url} if endpoint_url else {}),
        )

    async def save(
        self,
        content: bytes,
        path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self._client.put_object(
                Bucket=self.bucket,
                Key=path,
                Body=content,
                ContentType=content_type,
            ),
        )
        if self._endpoint_url:
            return f"{self._endpoint_url.rstrip('/')}/{self.bucket}/{path}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{path}"

    async def delete(self, path: str) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self._client.delete_object(Bucket=self.bucket, Key=path),
        )


def get_storage() -> StorageService:
    """Return the configured storage backend."""
    from app.config import settings  # local import avoids circular deps at module load

    if settings.storage_backend == "s3":
        return S3Storage(
            bucket=settings.aws_s3_bucket or "",
            region=settings.aws_region,
            access_key=settings.aws_access_key_id or "",
            secret_key=settings.aws_secret_access_key or "",
            endpoint_url=settings.aws_endpoint_url or None,
        )
    return LocalStorage(upload_dir=settings.upload_dir)
