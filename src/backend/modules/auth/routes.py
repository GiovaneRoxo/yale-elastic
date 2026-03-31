from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer

from infra.sqlite import get_db, engine, Base
from modules.auth.models import UserTable
from core.security import get_password_hash, verify_password, create_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["Autentication"])

# Dica: No futuro, mova esta classe para backend/modules/auth/schemas.py
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: Optional[str] = None
    is_seller: bool = True

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserTable).filter(UserTable.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    hashed = get_password_hash(user.password)
    
    # Cria o novo usuário
    novo_usuario = UserTable(
        name=user.name,
        email=user.email,
        hashed_password=hashed,
        company=user.company,
        is_seller=user.is_seller
    )
    db.add(novo_usuario)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # O Swagger envia o email no campo 'username'
    db_user = db.query(UserTable).filter(UserTable.email == form_data.username).first()
    
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    token = create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Abre o "crachá" (Token)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # O "sub" é a convenção onde guardamos o "dono" do token na hora de gerar.
        # Se no seu login você guardou o ID em vez do email, mude aqui.
        email: str = payload.get("sub") 
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # 2. Vai ao banco de dados conferir se o cara ainda existe
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise credentials_exception
        
    return user