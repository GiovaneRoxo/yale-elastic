from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import home, pecas, auth

app = FastAPI(title="API Catálogo Yale A975", version="1.2")

app = FastAPI(
    title="API Catálogo Yale A975",
    version="1.3",
    # Isso aqui força o Swagger a mostrar o botão de login global
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluímos as rotas separadas por módulos
app.include_router(api.routes.parts.router)
app.include_router(api.routes.auth.router)

from api.core.auth_utils import oauth2_scheme