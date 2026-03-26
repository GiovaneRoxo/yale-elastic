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
    Captura o título da seção (ex: CAPÔ, CHASSIS E ASSOALHO)
    """
    linhas = texto.split("\n")
    for linha in linhas[:5]:
        linha = linha.strip()
        if linha.isupper() and len(linha) > 3:
            return linha
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

            # Atualiza seção olhando página anterior
            if i > 0:
                texto_ant = pdf.pages[i - 1].extract_text()
                secao = extrair_secao(texto_ant)
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