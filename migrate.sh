#!/bin/bash

echo "🚀 Iniciando a reestruturação profissional do Yale-Elastic..."

# 1. Criar a nova árvore de diretórios conforme o plano
mkdir -p src/api/core src/api/deps src/api/infra src/api/modules/auth src/api/modules/parts src/shared tools data

# 2. Mover arquivos da API para o src/
echo "📦 Movendo arquivos da aplicação..."
[ -f api/main.py ] && mv api/main.py src/api/main.py
[ -f api/models.py ] && mv api/models.py src/api/modules/parts/schemas.py
[ -f api/routes/auth.py ] && mv api/routes/auth.py src/api/modules/auth/routes.py
[ -f api/routes/pecas.py ] && mv api/routes/pecas.py src/api/modules/parts/routes.py

# 3. Organizar Infraestrutura e Core
echo "⚙️  Configurando infra e core..."
[ -f api/database.py ] && mv api/database.py src/api/infra/elasticsearch.py
[ -f api/db/database_auth.py ] && mv api/db/database_auth.py src/api/infra/sqlite.py
[ -f api/utils/auth_utils.py ] && mv api/utils/auth_utils.py src/api/core/security.py

# 4. Mover scripts de automação para tools/
echo "🛠️  Movendo ferramentas..."
mv tools/*.py tools/ 2>/dev/null || true
mv *.py tools/ 2>/dev/null || true # Move app.py e outros soltos na raiz para tools
mv scripts/* tools/ 2>/dev/null || true

# 5. Criar arquivos __init__.py necessários para o Python reconhecer os pacotes
find src -type d -exec touch {}/__init__.py \;

# 6. Criar o arquivo de configuração centralizada
echo "📝 Criando src/api/core/config.py..."
cat <<EOF > src/api/core/config.py
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
    
    # SQLite
    DATABASE_URL: str = "sqlite:///./src/api/infra/usuarios.db"

    class Config:
        env_file = ".env"

settings = Settings()
EOF

echo "✅ Estrutura de pastas criada com sucesso!"
echo "⚠️  Lembre-se de atualizar os IMPORTS nos arquivos e o seu Dockerfile."