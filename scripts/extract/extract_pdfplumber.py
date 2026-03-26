import pdfplumber
import re
import json
import os

PDF_PATH = "/root/projetos/yale-elastic/scripts/pdfs/A975.pdf"
OUTPUT_JSON = "/root/projetos/yale-elastic/data/A975_full_catalog.json"

def limpar_texto(txt):
    if not txt:
        return ""
    return re.sub(r"\s+", " ", txt).strip()


def extrair_secao(texto):
    """
    Captura o título da seção (ex: CAPÔ, SISTEMA DE ACELERAÇÃO... (até 2009))
    """
    if not texto:
        return None
        
    # LISTA NEGRA atualizada
    blacklist = ["REF", "CÓDIGO", "DESCRIÇÃO", "QTDE", "OBS", "ITEM", "CHASSIS 1", "PÁGINA"]
    
    linhas = texto.split("\n")
    for linha in linhas[:5]:
        linha_limpa = linha.strip()
        if not linha_limpa:
            continue
            
        # O PULO DO GATO: Isola a parte ANTES do parêntese.
        # "SISTEMA GM (até 2009)" vira apenas "SISTEMA GM" para o teste
        texto_base = linha_limpa.split('(')[0].strip()
        
        # 1. texto_base tem que existir e ser todo maiúsculo
        # 2. texto_base maior que 3 letras
        # 3. Não começa com número
        # 4. A linha toda não contém termos da blacklist
        if (texto_base 
            and texto_base.isupper() 
            and len(texto_base) > 3 
            and not texto_base[0].isdigit() 
            and not any(termo in linha_limpa.upper() for termo in blacklist)):
            
            # Cortamos o lixo se for a palavra "Figura", mas mantemos coisas como "(até 2009)"
            titulo_final = re.split(r'\s*\([Ff][Ii][Gg][Uu][Rr][Aa]', linha_limpa)[0].strip()
            
            return titulo_final
            
    return None


def eh_pagina_tabela(texto):
    """
    Detecta se é página de tabela
    """
    return "Código" in texto and "Descrição" in texto


def parse_linha(linha):
    """
    Tenta extrair:
    Ref | Código | Descrição | Quantidade(s) | OBS
    """
    linha = limpar_texto(linha)

    # padrão mais flexível
    match = re.match(
        r"^(\d+)\s+([0-9A-Z]{6,})\s+(.*?)\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(.*))?$",
        linha
    )

    if not match:
        return None

    ref, codigo, descricao, q1, q2, q3, obs = match.groups()

    # trata quantidades
    if q2:
        quantidade = {
            "tipo": "multipla",
            "A": q1,
            "B": q2,
            "C": q3
        }
    else:
        quantidade = {
            "tipo": "unica",
            "valor": q1
        }

    return {
        "ref": ref,
        "codigo": codigo,
        "descricao": descricao.strip(),
        "quantidade": quantidade,
        "obs": obs.strip() if obs else ""
    }


def extrair_pdf():
    resultado = []
    secao_atual = None

    with pdfplumber.open(PDF_PATH) as pdf:
        for i in range(15, len(pdf.pages)):  # começa da página 16 (index 15)
            pagina = pdf.pages[i]
            texto = pagina.extract_text()

            if not texto:
                continue

            # 1. TENTA ACHAR O TÍTULO NA PÁGINA ATUAL PRIMEIRO
            secao = extrair_secao(texto)
            
            # 2. SE NÃO ACHAR, TENTA NA PÁGINA ANTERIOR
            if not secao and i > 0:
                texto_ant = pdf.pages[i - 1].extract_text()
                secao = extrair_secao(texto_ant)
            
            # 3. ATUALIZA A MEMÓRIA SÓ SE ACHOU ALGO VÁLIDO
            if secao:
                secao_atual = secao

            if not eh_pagina_tabela(texto):
                continue

            linhas = texto.split("\n")

            for linha in linhas:
                item = parse_linha(linha)

                if item:
                    item["secao"] = secao_atual
                    item["pagina"] = i + 1
                    item["imagem_ref"] = f"assets/ilustracoes/A975_pag_{i:03d}.jpg"

                    resultado.append(item)

    return resultado


def salvar_json(dados):
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    dados = extrair_pdf()
    salvar_json(dados)

    print(f"✅ Extração finalizada: {len(dados)} itens")