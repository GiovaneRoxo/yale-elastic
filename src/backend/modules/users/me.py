from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from modules.auth.models import UserResponse, UserTable
from core.security import get_current_user
from infra.sqlite import get_db

router = APIRouter(tags=["Users"])

@router.get("/users/me", response_model=UserResponse)
def read_users_me(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(UserTable).filter(UserTable.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return user