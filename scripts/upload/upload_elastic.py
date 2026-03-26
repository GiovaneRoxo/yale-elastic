import json
import os
from elasticsearch import Elasticsearch, helpers

# Configuração de conexão (Ajustada para o seu Docker atual)
es = Elasticsearch("http://localhost:9200")

def carregar_dados():
    # Caminho ajustado para a sua nova estrutura de pastas
    caminho_json = 'data/A975_full_catalog.json'
    
    if not os.path.exists(caminho_json):
        print(f"❌ Erro: Arquivo {caminho_json} não encontrado!")
        return

    print(f"Lendo dados de {caminho_json}...")
    with open(caminho_json, 'r', encoding='utf-8') as f:
        dados = json.load(f)
    
    print(f"Preparando {len(dados)} itens para o Elasticsearch...")
    
    # Gerador de ações para o modo Bulk (muito mais rápido que um por um)
    acoes = [
        {
            "_index": "yale_a975",
            "_source": item
        }
        for item in dados
    ]
    
    try:
        # Envia tudo de uma vez para o Ryzen processar
        helpers.bulk(es, acoes)
        print(f"✅ Sucesso! {len(dados)} itens enviados para o índice 'yale_a975'.")
    except Exception as e:
        print(f"❌ Erro durante o upload: {e}")

if __name__ == "__main__":
    carregar_dados()