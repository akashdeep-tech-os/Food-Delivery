from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json
from pathlib import Path


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/food_delivery"
    SECRET_KEY: str = "dev-only-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:5173","http://localhost:5174"]'

    @property
    def cors_origins_list(self) -> List[str]:
        value = self.CORS_ORIGINS.strip()
        try:
            return json.loads(value) if value.startswith("[") else [item.strip() for item in value.split(",") if item.strip()]
        except json.JSONDecodeError as exc:
            raise ValueError("CORS_ORIGINS must be a JSON array or comma-separated list") from exc

    def validate_for_runtime(self) -> None:
        if self.APP_ENV.lower() in {"production", "staging"}:
            if self.SECRET_KEY == "dev-only-change-me" or len(self.SECRET_KEY) < 32:
                raise RuntimeError("SECRET_KEY must be a strong value of at least 32 characters")
            if "password@localhost" in self.DATABASE_URL:
                raise RuntimeError("DATABASE_URL must be configured for non-development environments")

        Path(self.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
