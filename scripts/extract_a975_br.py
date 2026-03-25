import re
import json
import os

def extrair_v7_final(pdf_path, pagina_num):
    import pdfplumber
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[pagina_num - 1]
        texto = page.extract_text()
        if not texto: return []
            
        linhas = texto.split('\n')
        
        # 1. Identifica os nomes limpos das legendas (ex: Diesel, GLP)
        modelo_a_txt = "Modelo A"
        modelo_b_txt = "Modelo B"
        
        for l in linhas:
            if "Coluna A:" in l: 
                modelo_a_txt = l.split("Coluna A:")[-1].strip()
            if "Coluna B:" in l: 
                modelo_b_txt = l.split("Coluna B:")[-1].strip()

        titulo = linhas[1].strip() if len(linhas) > 1 else "DESCONHECIDO"

        pecas = []
        # Regex para o padrão de colunas A e B
        padrao_peca = re.compile(r"^(\d+)\s+(\d{7,10})\s+(.*?)\s+(\d+)\s+(\d+)(?:\s+(.*))?$")

        for linha in linhas:
            match = padrao_peca.match(linha.strip())
            if match:
                ref, cod, nome, q_a, q_b, obs = match.groups()
                
                pecas.append({
                    "secao": titulo,
                    "item": ref,
                    "codigo": cod,
                    "nome": nome.strip(),
                    "observacao": obs.strip() if obs else "",
                    "quantidades": {
                        "legenda": {
                            "modelo_a": modelo_a_txt,
                            "modelo_b": modelo_b_txt
                        },
                        "modelo_a": q_a,
                        "modelo_b": q_b
                    }
                })
        return pecas

# --- EXECUÇÃO ---
PDF_FILE = "scripts/A975.pdf"
dados = extrair_v7_final(PDF_FILE, 23)

with open('data/yale_br_limpo.json', 'w', encoding='utf-8') as f:
    json.dump(dados, f, ensure_ascii=False, indent=4)

print(f"✅ JSON gerado com legendas simplificadas para {len(dados)} itens.")