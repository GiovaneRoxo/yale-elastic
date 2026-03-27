from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yale A975 API"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ELASTIC_URL: str
    INDEX_NAME: str
    DATABASE_URL: str

    class Config:
        # Força o Pydantic a olhar na raiz do container, onde o volume mapeia o .env
        env_file = "/app/.env" 
        extra = "ignore"

settings = Settings()