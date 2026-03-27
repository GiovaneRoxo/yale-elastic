import os
from elasticsearch import Elasticsearch

ES_URL = os.getenv("ELASTIC_URL", "http://localhost:9200")
INDEX_NAME = "yale_a975"


es = Elasticsearch(
    ES_URL,
    # Adicionamos essas duas travas de segurança
    verify_certs=False,
    request_timeout=30
)

es.options(headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"})