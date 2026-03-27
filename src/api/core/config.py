import os
from pydantic_settings import BaseSettings

# Detecta a pasta raiz (yale-elastic/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yale A975 API"
    SECRET_KEY: str = "mude-me-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Elasticsearch
    ELASTIC_URL: str = "http://elasticsearch:9200"
    INDEX_NAME: str = "yale_a975"
    
    # SQLite - Caminho Absoluto
    # Isso garante que ele aponte para /app/src/api/infra/usuarios.db
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'api', 'infra', 'usuarios.db')}"

    class Config:
        env_file = ".env"

settings = Settings()