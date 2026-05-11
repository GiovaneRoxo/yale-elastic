import os
import json
import time
import re
from google import genai 
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

class Quantity(BaseModel):
    type: str 
    value: str

class Part(BaseModel):
    catalog: str
    forklifts: str
    ref: str
    code: str
    description: str
    quantity: Quantity
    obs: str
    section: str
    # Removemos o campo 'pag' daqui! A peça já não precisa de adivinhar a sua página.

# NOVA CLASSE: Força a IA a agrupar as peças dentro da página correta
class PageExtraction(BaseModel):
    pag: int
    pecas: list[Part]

def split_pdf_text(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return [p.strip() for p in re.split(r'--- INÍCIO DA PÁGINA \d+ ---', content) if p.strip()]

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=60))
def extract_from_batch(batch_text):
    response = client.models.generate_content(
        model="gemini-2.5-pro", 
        contents=f"Extraia as peças destas páginas de catálogo:\n\n{batch_text}",
        config={
            "system_instruction": """Você é um especialista rigoroso em extração de catálogos Yale.
                Sua tarefa é converter blocos de texto em uma lista de páginas, contendo as suas respectivas peças.
                
                REGRA DE EXCLUSÃO ABSOLUTA:
                - É ESTRITAMENTE PROIBIDO extrair itens onde o campo 'code' ou 'description' sejam vazios.
                - Se a página for uma capa, índice ou aviso legal sem peças, retorne a página com a lista de 'pecas' VAZIA [].
                
                REGRAS DE MAPEAMENTO:
                1. 'pag': Identifique o número exato no marcador '--- INÍCIO DA PÁGINA X ---'. Crie um objeto PageExtraction para cada marcador que encontrar.
                2. 'pecas': Coloque aqui apenas as peças que pertencem a esta página específica.
                3. 'quantity.type': 'unique' ou 'variable'.
                """,
            "response_mime_type": "application/json",
            "response_schema": list[PageExtraction], # O pulo do gato: esquema aninhado
        }
    )
    try:
        return json.loads(response.text)
    except Exception as e:
        print(f"⚠️ Erro no processamento: {e}")
        return []

def main():
    input_file = "textextraido.txt"
    output_file = "teste_50_paginas_aninhado.json"
    batch_size = 5 
    limite_teste = 50 
    
    print(f"🧪 Iniciando TESTE ESTRUTURAL ({limite_teste} páginas)...")
    
    todas_paginas = split_pdf_text(input_file)
    paginas = todas_paginas[:limite_teste] 
    
    if not paginas: return

    final_data = []

    for i in range(0, len(paginas), batch_size):
        lote_paginas = paginas[i:i + batch_size]
        texto_do_lote = "\n\n".join(lote_paginas)
        
        num_lote = (i // batch_size) + 1
        total_lotes = (len(paginas) + batch_size - 1) // batch_size
        
        print(f"📦 Lote {num_lote}/{total_lotes}...", end="\r")
        
        data = extract_from_batch(texto_do_lote)
        
        if data:
            # O processamento Python agora "desempacota" as páginas
            for pagina_extraida in data:
                numero_pagina = pagina_extraida.get("pag")
                
                for item in pagina_extraida.get("pecas", []):
                    # Filtro "faca na caveira" local
                    if item.get("code") and str(item.get("code")).strip() != "" and item.get("description"):
                        # Injetamos a página na peça antes de salvar no array final
                        item["pag"] = numero_pagina
                        final_data.append(item)
        
        time.sleep(1) 

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=4)
    
    print(f"\n✅ Teste concluído com precisão posicional! Salvo em {output_file}")

if __name__ == "__main__":
    main()