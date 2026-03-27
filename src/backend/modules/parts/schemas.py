from pydantic import BaseModel
from typing import Optional, List, Any

class Part(BaseModel):
    ref: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    section: Optional[str] = None
    pag: Optional[int] = None
    imagem_ref: Optional[str] = None
    obs: Optional[str] = None
    quantity: Optional[Any] = None

class GetResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Part]