import json
import requests

# CONFIGURAÇÃO
JSON_FILE = 'data/teste_unidade.json'
# Como o script roda no mesmo servidor do Docker, usamos localhost
ELASTIC_URL = "http://localhost:9200/yale_pecas/_bulk"

def fazer_upload():
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            pecas = json.load(f)

        # O formato Bulk exige uma linha de comando e uma linha de dado para cada item
        payload = ""
        for peca in pecas:
            payload += json.dumps({"index": {}}) + "\n"
            payload += json.dumps(peca) + "\n"

        headers = {'Content-Type': 'application/x-ndjson'}
        
        print(f"Enviando {len(pecas)} peças para o Elasticsearch...")
        response = requests.post(ELASTIC_URL, data=payload, headers=headers)

        if response.status_code == 200:
            print("Sucesso total! O motor da Yale está alimentado.")
            # print(response.json()) # Descomente se quiser ver o log de sucesso
        else:
            print(f"Erro no upload: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Erro ao ler o arquivo ou conectar no Elastic: {e}")

if __name__ == "__main__":
    fazer_upload()