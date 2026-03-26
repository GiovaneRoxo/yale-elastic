from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from typing import Optional, List, Any
from pydantic import BaseModel
import os  

# --- MODELOS DE DADOS (Para o Swagger e Validação) ---
class Peca(BaseModel):
    ref: Optional[str] = None
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    secao: Optional[str] = None
    pagina: Optional[int] = None
    imagem_ref: Optional[str] = None
    obs: Optional[str] = None
    quantidade: Optional[Any] = None

class BuscaResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[Peca]

# --- INICIALIZAÇÃO ---
app = FastAPI(title="API Catálogo Yale A975", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ES_URL = os.getenv("ELASTIC_URL", "http://localhost:9200")
es = Elasticsearch([ES_URL])
INDEX_NAME = "yale_a975"

@app.get("/")
def home():
    return {
        "status": "online", 
        "mensagem": "API Yale Yale A975 operacional! 🚀",
        "docs": "/docs"
    }

@app.get("/api/pecas", response_model=BuscaResponse)
def buscar_pecas(
    q: Optional[str] = Query("", description="Termo de busca (descrição, código, etc)"),
    page: int = Query(1, description="Número da página"),
    limit: int = Query(20, description="Resultados por página")
):
    start = (page - 1) * limit
    
    try:
        # Se não houver busca, retornamos vazio de forma limpa
        if not q:
            return {"total": 0, "page": page, "limit": limit, "data": []}

        # Busca no Elasticsearch
        # Nota: troquei 'nome' por 'descricao' para bater com seu JSON
        response = es.search(
            index=INDEX_NAME,
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
        
        # Extrai o _source de cada resultado
        resultados = [hit["_source"] for hit in hits]
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "data": resultados
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro na busca ou conexão com Elastic: {str(e)}"
        )