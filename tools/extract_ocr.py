import pdfplumber
import re
import json
import os

# OCR
import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np

# CONFIG
PDF_PATH = "/root/projetos/yale-elastic/scripts/pdfs/A975.pdf"
OUTPUT_JSON = "/root/projetos/yale-elastic/data/A975_full_catalog.json"

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

# ----------------------------
# UTIL
# ----------------------------

def limpar_texto(txt):
    if not txt:
        return ""
    return re.sub(r"\s+", " ", txt).strip()


def corrigir_ocr(txt):
    if not txt:
        return ""

    txt = txt.replace("|", "1")
    txt = txt.replace("l", "1")

    return txt


# ----------------------------
# OCR
# ----------------------------

def preprocessar_imagem(img):
    img = np.array(img)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    return thresh


def extrair_texto_ocr(img):
    return pytesseract.image_to_string(img, lang='por')


# ----------------------------
# DETECÇÃO
# ----------------------------

def extrair_secao(texto):
    linhas = texto.split("\n")
    buffer = []

    for linha in linhas:
        linha = linha.strip()

        if len(linha) < 5:
            continue

        if linha.upper() == linha:
            buffer.append(linha)
        else:
            if buffer:
                return " ".join(buffer)

    if buffer:
        return " ".join(buffer)

    return None


def eh_pagina_tabela(texto):
    return "Código" in texto and "Descrição" in texto


# ----------------------------
# PARSER
# ----------------------------

def parse_linha(linha):
    linha = limpar_texto(linha)
    linha = corrigir_ocr(linha)

    match = re.match(
        r"^(\d+)\s+([0-9A-Z]{6,})\s+(.*?)\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(.*))?$",
        linha
    )

    if not match:
        return None

    ref, codigo, descricao, q1, q2, q3, obs = match.groups()

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
        "observacao": obs.strip() if obs else ""
    }


# ----------------------------
# SALVAR PARCIAL
# ----------------------------

def salvar_parcial(dados):
    with open("parcial.json", "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def salvar_json(dados):
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)


# ----------------------------
# EXTRAÇÃO PRINCIPAL (BATCH)
# ----------------------------

def extrair_pdf():
    resultado = []
    secao_atual = None

    BATCH_SIZE = 3   # 🔥 diminui se quiser mais leve
    DPI = 200        # 🔥 pode reduzir pra 150 se travar

    with pdfplumber.open(PDF_PATH) as pdf:
        total_paginas = len(pdf.pages)

        for inicio in range(15, total_paginas, BATCH_SIZE):
            fim = min(inicio + BATCH_SIZE, total_paginas)

            print(f"📦 Processando páginas {inicio+1} até {fim}")

            imagens = convert_from_path(
                PDF_PATH,
                dpi=DPI,
                first_page=inicio + 1,
                last_page=fim
            )

            for offset, img in enumerate(imagens):
                i = inicio + offset
                pagina = pdf.pages[i]

                texto = pagina.extract_text()

                # OCR fallback
                if not texto or len(texto.strip()) < 50:
                    print(f"⚠️ OCR página {i+1}")
                    img_proc = preprocessar_imagem(img)
                    texto = extrair_texto_ocr(img_proc)

                if not texto:
                    continue

                # SEÇÃO
                if i > 0:
                    texto_ant = pdf.pages[i - 1].extract_text()

                    if not texto_ant or len(texto_ant.strip()) < 50:
                        img_ant = preprocessar_imagem(img)
                        texto_ant = extrair_texto_ocr(img_ant)

                    secao = extrair_secao(texto_ant)
                    if secao:
                        secao_atual = secao

                # TABELA
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

            # salva progresso
            salvar_parcial(resultado)

            # libera memória
            del imagens

    return resultado


# ----------------------------
# MAIN
# ----------------------------

if __name__ == "__main__":
    dados = extrair_pdf()
    salvar_json(dados)

    print(f"✅ Extração finalizada: {len(dados)} itens")