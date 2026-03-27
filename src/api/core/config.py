from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yale A975 API"
    SECRET_KEY: str = "mude-me-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Elasticsearch
    ELASTIC_URL: str = "http://elasticsearch:9200"
    INDEX_NAME: str = "yale_a975"
    
    # SQLite - Caminho "Hardcoded" para o ambiente Linux do Docker
    # O Docker monta a tua pasta 'src' em '/app/src'
    # Vamos garantir que ele aponte para lá sem erro de lógica
    DATABASE_URL: str = "sqlite:////app/src/api/infra/usuarios.db"

    class Config:
        env_file = ".env"

settings = Settings()