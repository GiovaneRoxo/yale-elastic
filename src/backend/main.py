from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.parts import routes as parts
from modules.auth import routes as auth
from infra.sqlite import engine, Base

Base.metadata.create_all(bind=engine)

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


# Incluímos as rotas separadas
app.include_router(parts.router)
app.include_router(auth.router)

from backend.core.security import oauth2_scheme