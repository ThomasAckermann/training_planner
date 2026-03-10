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
