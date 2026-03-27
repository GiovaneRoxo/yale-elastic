from fastapi import APIRouter

# Este é o atributo que o main.py está procurando!
router = APIRouter()

@router.get("/")
def home():
    return {
        "status": "online", 
        "mensagem": "API Yale Yale A975 operacional! 🚀",
        "docs": "/docs"
    }