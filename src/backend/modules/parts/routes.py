from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from fastapi import Depends

from .schemas import GetResponse
from infra.elasticsearch import es
from core.config import settings
from core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Parts"])

@router.get("/parts", response_model=GetResponse)
def get_parts(
    q: Optional[str] = Query("", description="Termo de busca"),
    page: int = Query(1, description="Número da página"),
    limit: int = Query(20, description="Resultados por página"),
    current_user: str = Depends(get_current_user)
):
    start = (page - 1) * limit
    try:
        if not q:
            return {"total": 0, "page": page, "limit": limit, "data": []}

        response = es.search(
            index=settings.INDEX_NAME,
            query={
                "multi_match": {
                    "query": q,
                    "fields": ["descricao", "codigo", "secao", "obs"],
                    "fuzziness": "AUTO"
                }
            },
            from_=start,
            size=limit
        )
        
        hits = response["hits"]["hits"]
        total = response["hits"]["total"]["value"]
        resultados = [hit["_source"] for hit in hits]
        
        return {"total": total, "page": page, "limit": limit, "data": resultados}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))