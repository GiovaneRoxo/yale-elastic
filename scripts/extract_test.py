import pdfplumber
import re
import json
import os

# --- CONFIGURAÇÕES DO UTILIZADOR ---
PDF_PATH = "scripts/A975.pdf"  # O nome do ficheiro que subiste
PAGINA_ALVO = 23               # A página que vimos na imagem

def extrair_dados_completos(pdf_path, pagina_num):
    if not os.path.exists(pdf_path):
        return f"Erro: O ficheiro {pdf_path} não foi encontrado!"

    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[pagina_num - 1]
        texto = page.extract_text()
        linhas = texto.split('\n')
        
        # 1. Captura o TÍTULO (Procura a primeira linha em CAIXA ALTA longa)
        titulo = "NÃO IDENTIFICADO"
        for l in linhas[:8]: # Aumentei o range para garantir que acha o título
            if l.isupper() and len(l) > 8 and "PÁGINA" not in l:
                titulo = l.strip()
                break

        # 2. Captura a LEGENDA (Modelo A e B)
        legenda_a = ""
        legenda_b = ""
        for l in linhas:
            if "A =" in l or "A=" in l: legenda_a = l.strip()
            if "B =" in l or "B=" in l: legenda_b = l.strip()

        # 3. REGEX PARA LINHA DE PEÇA
        # [ITEM] [CÓDIGO/NOME] [OBS (opcional)] [PONTOS] [QTD A] [QTD B (opcional)]
        padrao_linha = re.compile(r"^\s*(\d+)\s+(.*?)(?:\s+([a-z]))?\s+\.{2,}\s+(\d+)(?:\s+(\d+))?$")

        pecas = []
        for linha in linhas:
            match = padrao_linha.match(linha.strip())
            if match:
                item, miolo, obs, qtd_a, qtd_b = match.groups()
                
                # Trata o miolo (Código vs Nome)
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

# --- EXECUÇÃO ---
try:
    dados = extrair_dados_completos(PDF_PATH, PAGINA_ALVO)
    
    # Gravação do resultado
    os.makedirs('data', exist_ok=True)
    with open('data/yale_br_completo.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)

    print(f"✅ Sucesso! Extraídos {len(dados)} itens da página {PAGINA_ALVO}.")
    print(f"📂 Ficheiro guardado em: data/yale_br_completo.json")
    
    # Print do primeiro item para conferires o visual
    if dados:
        print("\nExemplo do primeiro item extraído:")
        print(json.dumps(dados[0], indent=4, ensure_ascii=False))

except Exception as e:
    print(f"❌ Ocorreu um erro: {e}")