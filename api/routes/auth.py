from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.db.database_auth import get_db, UserTable 
from api.utils.auth_utils import gerar_hash_senha, verificar_senha, criar_token_acesso
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["Autenticação"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    empresa: Optional[str] = None
    is_vendedor: bool = True

@router.post("/register")
def registrar_usuario(user: UserCreate, db: Session = Depends(get_db)):
    # Verifica se o e-mail já existe
    db_user = db.query(UserTable).filter(UserTable.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    hashed = gerar_hash_senha(user.password)
    
    # Cria o novo usuário
    novo_usuario = UserTable(
        name=user.name,
        email=user.email,
        hashed_password=hashed,
        empresa=user.empresa,
        is_vendedor=user.is_vendedor
    )
    db.add(novo_usuario)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # O Swagger envia o email no campo 'username'
    db_user = db.query(UserTable).filter(UserTable.email == form_data.username).first()
    
    if not db_user or not verificar_senha(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    token = criar_token_acesso(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}