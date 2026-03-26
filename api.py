from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from typing import Optional

# 1. Inicializa a API
app = FastAPI(title="API Catálogo Yale A975", version="1.0")

# 2. Resolve o CORS (Permite que o React no porto 5173 fale com a API no 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, trocas o "*" pelo URL do teu site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Ligação à Base de Dados
es = Elasticsearch(["http://localhost:9200"])
INDEX_NAME = "yale_a975"

@app.get("/")
def home():
    return {
        "status": "online", 
        "mensagem": "A API da Yale está a rodar lisinha! 🚀",
        "documentacao": "/docs"
    }

@app.get("/api/pecas")
def buscar_pecas(
    q: Optional[str] = Query("", description="Termo de busca (nome, código, etc)"),
    page: int = Query(1, description="Número da página para paginação"),
    limit: int = Query(20, description="Quantidade de resultados por página")
):
    # Calcula onde começa a busca (ex: página 2 com limite 20, começa no 20)
    start = (page - 1) * limit
    
    try:
        if not q:
            # Se a busca for vazia, devolvemos uma estrutura limpa em vez de um erro
            return {"total": 0, "page": page, "limit": limit, "data": []}
            
        # 4. A Inteligência da Busca (Motor Elasticsearch)
        response = es.search(
            index=INDEX_NAME,
            query={
                "multi_match": {
                    "query": q,
                    "fields": ["nome", "secao", "codigo", "item"], # Busca inteligente em vários campos
                    "fuzziness": "AUTO" # Tolera erros de digitação
                }
            },
            from_=start,
            size=limit
        )
        
        hits = response["hits"]["hits"]
        total_encontrado = response["hits"]["total"]["value"]
        
        # Formata os dados limpinhos para o React
        resultados = [hit["_source"] for hit in hits]
        
        return {
            "total": total_encontrado,
            "page": page,
            "limit": limit,
            "data": resultados
        }
        
    except Exception as e:
        # Se o Docker do Elastic morrer, a API avisa o Front-end com classe
        raise HTTPException(status_code=500, detail=f"Erro de ligação à base de dados: {str(e)}")