from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from infra.sqlite import Base, engine
from modules.auth import routes as auth_routes
from modules.parts import routes as parts_routes
from modules.users import me as users_me
import os
from fastapi.staticfiles import StaticFiles

# 1. O app "nasce" AQUI (antes de qualquer middleware)
app = FastAPI(title="Yale API")

# 2. Agora que o app existe, adicionamos o CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Adicionamos as rotas
app.include_router(auth_routes.router)
app.include_router(parts_routes.router)
app.include_router(users_me.router) 

# Cria as tabelas no SQLite se não existirem
Base.metadata.create_all(bind=engine)

script_dir = os.path.dirname(__file__)
assets_path = os.path.join(script_dir, "../../tools/upload")

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")