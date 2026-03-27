import os
from elasticsearch import Elasticsearch

ES_URL = os.getenv("ELASTIC_URL", "http://localhost:9200")
es = Elasticsearch([ES_URL])
INDEX_NAME = "yale_a975"