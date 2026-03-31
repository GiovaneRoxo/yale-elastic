from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional

from .schemas import CatalogItem, GetResponse
from infra.elasticsearch import es
from core.config import settings
from core.security import get_current_user
from modules.auth.models import UserTable

router = APIRouter(prefix="/api", tags=["Parts"])

@router.get("/catalogs", response_model=list[CatalogItem])
def get_catalogs(current_user: UserTable = Depends(get_current_user)):
    try:
        response = es.search(
            index=settings.INDEX_NAME,
            size=0,
            aggs={
                "catalogos": {
                    "terms": {
                        "field": "modelo_catalogo.keyword",
                        "size": 1000
                    },
                    "aggs": {
                        "maquinas": {
                            "terms": {
                                "field": "maquinas_relacionadas.keyword",
                                "size": 1000
                            }
                        }
                    }
                }
            },
        )

        buckets = response.get("aggregations", {}).get("catalogos", {}).get("buckets", [])
        catalogs = []
        for bucket in buckets:
            modelo = bucket.get("key")
            if not modelo:
                continue
            maquinas_buckets = bucket.get("maquinas", {}).get("buckets", [])
            maquinas = [m.get("key") for m in maquinas_buckets if m.get("key")]
            catalogs.append(
                CatalogItem(
                    modelo_catalogo=modelo,
                    maquinas_relacionadas=maquinas,
                )
            )

        # Fallback para ambiente inicial sem documentos enriquecidos.
        if not catalogs:
            return [
                CatalogItem(
                    modelo_catalogo="A975",
                    maquinas_relacionadas=["GLP/GDP 40-70VX"],
                )
            ]

        return catalogs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
                        "quantidade.tipo", "quantidade.valor", "quantidade.A",
                        "modelo_catalogo", "maquinas_relacionadas"
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