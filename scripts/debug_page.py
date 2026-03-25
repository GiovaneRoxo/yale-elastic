import pdfplumber
import re
import json
import os

# CONFIGURAÇÕES
PDF_PATH = "scripts/A975.pdf"
PAGINA_ALVO = 23 

def extrair_v4(pdf_path, pagina_num):
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[pagina_num - 1]
        texto = page.extract_text()
        if not texto:
            return "Erro: Não foi possível extrair texto da página."
            
        linhas = texto.split('\n')
        
        # --- DEBUG: Vamos ver as primeiras 10 linhas no terminal ---
        print(f"--- DEBUG: Primeiras linhas da página {pagina_num} ---")
        for i, l in enumerate(linhas[:15]):
            print(f"L{i}: {l}")
        print("--------------------------------------------------")

        # 1. Título e Legendas
        titulo = "NÃO IDENTIFICADO"
        legenda_a = ""
        legenda_b = ""
        
        for l in linhas:
            if l.isupper() and len(l) > 10 and "PÁGINA" not in l:
                titulo = l.strip()
            if "A =" in l or "A=" in l: legenda_a = l.strip()
            if "B =" in l or "B=" in l: legenda_b = l.strip()

        # 2. REGEX SIMPLIFICADA (O "Anzol")
        # Procura: [Número] [Texto] [Muitos Pontos] [Número]
        # Mudamos de match() para search() para ignorar lixo no início da linha
        pecas = []
        for linha in linhas:
            # Esta regex é mais "elástica"
            match = re.search(r"(\d+)\s+(.*?)(?:\s+([a-z]))?\s+\.{2,}\s+(\d+)(?:\s+(\d+))?$", linha.strip())
            
            if match:
                item, miolo, obs, qtd_a, qtd_b = match.groups()
                
                # Separa Código e Nome
                if ". . . . ." in miolo:
                    codigo = "VER-KIT"
                    nome = miolo.replace(". . . . .", "").strip()
                else:
                    partes = miolo.split(maxsplit=1)
                    codigo = partes[0]
                    nome = partes[1] if len(partes) > 1 else ""

                pecas.append({
                    "secao": titulo,
                    "item": item,
                    "codigo": re.sub(r'^[a-z]+(?=\d)', '', codigo), 
                    "nome": nome.strip(),
                    "observacao": obs if obs else "",
                    "quantidades": {
                        "modelo_a": {"valor": qtd_a, "legenda": legenda_a},
                        "modelo_b": {"valor": qtd_b if qtd_b else qtd_a, "legenda": legenda_b}
                    }
                })
        return pecas

# Execução
dados = extrair_v4(PDF_PATH, PAGINA_ALVO)
if isinstance(dados, list):
    os.makedirs('data', exist_ok=True)
    with open('data/yale_br_completo.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)
    print(f"\n✅ Concluído! Itens encontrados: {len(dados)}")
else:
    print(dados)