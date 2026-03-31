from fastapi import APIRouter

# Se estiver no main.py, use @app.get(...
@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user