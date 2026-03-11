from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_JWT_SECRET = "dev-secret-key-change-in-production"
_DEFAULT_JWT_REFRESH_SECRET = "dev-refresh-secret-key-change-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = (
        "postgresql+asyncpg://volleycoach:volleycoach@localhost:5432/volleycoach"
    )
    jwt_secret: str = _DEFAULT_JWT_SECRET
    jwt_refresh_secret: str = _DEFAULT_JWT_REFRESH_SECRET
    upload_dir: str = "./uploads"
    frontend_url: str = "http://localhost:5173"
    frontend_dist_dir: str = "./frontend_dist"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    environment: str = "development"  # "development" | "production" | "test"

    # Storage — set STORAGE_BACKEND=s3 in production and provide credentials.
    # For AWS S3: set AWS_* vars, leave AWS_ENDPOINT_URL unset.
    # For Railway / other S3-compatible providers: also set AWS_ENDPOINT_URL.
    storage_backend: str = "local"  # "local" | "s3"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket: Optional[str] = None
    aws_region: str = "us-east-1"
    aws_endpoint_url: Optional[str] = None  # e.g. Railway Object Storage endpoint

    @model_validator(mode="after")
    def fix_database_url(self) -> "Settings":
        # Railway (and Heroku) inject DATABASE_URL as postgresql:// or postgres://
        # SQLAlchemy async requires the +asyncpg driver prefix.
        url = self.database_url
        if url.startswith("postgres://"):
            self.database_url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            self.database_url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self

    @model_validator(mode="after")
    def check_production_secrets(self) -> "Settings":
        if self.environment == "production":
            if self.jwt_secret == _DEFAULT_JWT_SECRET:
                raise ValueError(
                    "JWT_SECRET must be set to a secure value in production"
                )
            if self.jwt_refresh_secret == _DEFAULT_JWT_REFRESH_SECRET:
                raise ValueError(
                    "JWT_REFRESH_SECRET must be set to a secure value in production"
                )
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
