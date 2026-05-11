import pdfplumber
import os

def pdf_to_txt(pdf_path, txt_output):
    """
    Converte um PDF em TXT inserindo marcadores de página APENAS para páginas com conteúdo real.
    """
    if not os.path.exists(pdf_path):
        print(f"❌ Erro: Arquivo {pdf_path} não encontrado.")
        return

    print(f"📖 Abrindo o PDF: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        total_paginas = len(pdf.pages)
        print(f"📄 Total de páginas físicas no arquivo: {total_paginas}")
        
        paginas_validas = 0
        
        with open(txt_output, "w", encoding="utf-8") as f:
            for i, pagina in enumerate(pdf.pages):
                # O extract_text() pode puxar sujeira invisível
                texto = pagina.extract_text()
                
                # TESTE DE RACIOCÍNIO: O texto existe E tem mais do que lixo?
                # O strip() arranca quebras de linha e espaços nas pontas.
                # Exigimos len > 40 para ignorar páginas que tenham só um título ou rodapé solto.
                if texto and len(texto.strip()) > 40: 
                    
                    # Usamos i+1 para bater com a página absoluta do visualizador de PDF.
                    f.write(f"--- INÍCIO DA PÁGINA {i+1} ---\n")
                    f.write(texto.strip())
                    f.write("\n\n")
                    
                    paginas_validas += 1
                
                print(f"⏳ Processando: {i+1}/{total_paginas} | Salvas: {paginas_validas}", end="\r")

    print(f"\n✅ Concluído! Das {total_paginas} páginas, apenas {paginas_validas} tinham conteúdo útil.")
    print(f"📁 Salvo em: {txt_output}")

if __name__ == "__main__":
    arquivo_pdf = "A959_M16BR.pdf" 
    arquivo_txt = "textextraido.txt" 
    
    pdf_to_txt(arquivo_pdf, arquivo_txt)