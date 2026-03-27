from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Config
    PROJECT_NAME: str = "Yale A975 API"
    SECRET_KEY: str = "sua_chave_secreta_aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Elastic Config
    ELASTIC_URL: str = "http://elasticsearch:9200"
    INDEX_NAME: str = "yale_a975"
    
    # SQLite Config
    DATABASE_URL: str = "sqlite:///./src/api/db/usuarios.db"

    class Config:
        env_file = ".env"

settings = Settings()