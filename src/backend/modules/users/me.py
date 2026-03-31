from fastapi import APIRouter, Depends
from modules.auth.models import UserResponse, UserTable
from core.security import get_current_user

router = APIRouter(tags=["Users"])

@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: UserTable = Depends(get_current_user)):
    return current_user