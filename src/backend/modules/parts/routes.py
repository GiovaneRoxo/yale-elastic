from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional

from .schemas import GetResponse
from infra.elasticsearch import es
from core.config import settings
from core.security import get_current_user
from modules.auth.models import UserTable

router = APIRouter(prefix="/api", tags=["Parts"])

@router.get("/parts", response_model=GetResponse)
def get_parts(
    q: Optional[str] = Query("", description="Termo de busca"),
    page: int = Query(1, description="Número da página"),
    limit: int = Query(20, description="Resultados por página"),
    current_user: UserTable = Depends(get_current_user)
):
    start = (page - 1) * limit
    try:
        # Se a pesquisa for vazia, trazemos um lote inicial (match_all)
        if not q:
            query_body = {"match_all": {}}
        else:
            query_body = {
                "multi_match": {
                    "query": q,
                    # Agora você pode colocar TUDO de volta aqui
                    "fields": [
                        "ref", "codigo", "descricao", "secao", "obs", "pagina", "imagem_ref",
                        "quantidade.tipo", "quantidade.valor", "quantidade.A"
                    ],
                    "fuzziness": "AUTO",
                    "lenient": True  # <--- O AMORTECEDOR ESTÁ AQUI
                }
            }

        response = es.search(
            index=settings.INDEX_NAME,
            query=query_body,
            from_=start,
            size=limit
        )
        
        hits = response["hits"]["hits"]
        total = response["hits"]["total"]["value"]
        resultados = [hit["_source"] for hit in hits]
        
        return {"total": total, "page": page, "limit": limit, "data": resultados}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))