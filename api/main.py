from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import home, pecas

app = FastAPI(title="API Catálogo Yale A975", version="1.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluímos as rotas separadas
app.include_router(home.router)
app.include_router(pecas.router)