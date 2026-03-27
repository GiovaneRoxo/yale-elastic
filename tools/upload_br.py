import json
import requests

# Ajuste o IP se necessário (localhost se for no mesmo container)
ELASTIC_URL = "http://localhost:9200/yale_pecas_br/_bulk"
JSON_FILE = 'data/yale_br_limpo.json'

def subir_para_elastic():
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            dados = json.load(f)

        payload = ""
        for item in dados:
            # Criamos uma linha de comando (index) e uma de dados
            payload += json.dumps({"index": {}}) + "\n"
            payload += json.dumps(item) + "\n"

        headers = {'Content-Type': 'application/x-ndjson'}
        print(f"Subindo {len(dados)} peças para o índice 'yale_pecas_br'...")
        
        response = requests.post(ELASTIC_URL, data=payload, headers=headers)
        
        if response.status_code == 200:
            print("✅ Sucesso! Dados injetados no Ryzen.")
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Erro no processo: {e}")

if __name__ == "__main__":
    subir_para_elastic()