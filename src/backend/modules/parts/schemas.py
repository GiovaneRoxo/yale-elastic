from pydantic import BaseModel
from typing import Optional, List, Any

class Part(BaseModel):
    ref: Optional[str] = None
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    quantidade: Optional[Any] = None 
    obs: Optional[str] = None
    secao: Optional[str] = None
    pagina: Optional[int] = None
    imagem_ref: Optional[str] = None

class GetResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Part]