from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://volleycoach:volleycoach@localhost:5432/volleycoach"
    jwt_secret: str = "dev-secret-key-change-in-production"
    jwt_refresh_secret: str = "dev-refresh-secret-key-change-in-production"
    upload_dir: str = "./uploads"
    frontend_url: str = "http://localhost:5173"
    frontend_dist_dir: str = "./frontend_dist"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7


settings = Settings()
