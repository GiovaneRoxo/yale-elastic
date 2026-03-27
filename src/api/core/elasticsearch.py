from elasticsearch import Elasticsearch
from api.core.config import settings

es = Elasticsearch(
    settings.ELASTIC_URL,
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"}
)