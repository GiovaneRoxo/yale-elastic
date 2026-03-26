import os
import pdfplumber
from pdf2image import convert_from_path

# CONFIGURAÇÕES
PDF_PATH = "scripts/pdfs/A975.pdf" # Verifique se o caminho está correto aqui
OUTPUT_DIR = "assets/ilustracoes"
DPI = 150

def extrair_paginas_seguro():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 1. Descobre o total de páginas usando pdfplumber (mais compatível)
    print("Contando páginas...")
    with pdfplumber.open(PDF_PATH) as pdf:
        total_paginas = len(pdf.pages)
    
    print(f"Total de páginas detectadas: {total_paginas}")

    # 2. Processa em blocos pequenos para o SSH não cair
    tamanho_bloco = 5  # Baixei para 5 para ser ainda mais seguro
    
    for i in range(1, total_paginas + 1, tamanho_bloco):
        fim_bloco = min(i + tamanho_bloco - 1, total_paginas)
        print(f"Convertendo bloco: páginas {i} até {fim_bloco}...")
        
        try:
            images = convert_from_path(
                PDF_PATH, 
                dpi=DPI, 
                first_page=i, 
                last_page=fim_bloco,
                thread_count=1 # Um core por vez para economizar RAM
            )

            for j, image in enumerate(images):
                numero_real = i + j
                nome_arquivo = f"A975_pag_{numero_real:03d}.jpg"
                image.save(os.path.join(OUTPUT_DIR, nome_arquivo), "JPEG", quality=80)
                
            del images # Limpa a memória RAM imediatamente
        except Exception as e:
            print(f"Erro no bloco {i}-{fim_bloco}: {e}")

    print(f"✅ Sucesso! Imagens em {OUTPUT_DIR}")

if __name__ == "__main__":
    extrair_paginas_seguro()