import streamlit as st
from elasticsearch import Elasticsearch
import os

# 1. Configuração e Conexão
es = Elasticsearch(["http://localhost:9200"])
st.set_page_config(page_title="Catálogo Yale A975", layout="wide")
st.title("🚜 Buscador de Peças Yale A975")

# 2. Entrada do Usuário
query = st.text_input("Busque por Nome, Seção ou Código:")

if query:
    query = query.lower().strip()
    try:
        # 3. Execução da Busca
        query_body = {
            "bool": {
                "should": [
                    {
                        "multi_match": {
                            "query": query,
                            "fields": ["descricao^3", "secao^2", "codigo"],
                            "fuzziness": "AUTO"
                        }
                    },
                    {
                        "wildcard": {
                            "descricao": {
                                "value": f"*{query}*"
                            }
                        }
                    }
                ]
            }
        }
        response = es.search(
            index="yale_a975",
            query=query_body,
            highlight={
                "fields": {
                    "descricao": {
                    }
                }
            },
            sort=["_score"],
            size=50
        )
        
        results = response['hits']['hits']

        if results:
            st.success(f"Encontramos {len(results)} peças:")
            
            for hit in results:
                peca = hit['_source']
                
                # Card visual com borda
                with st.container(border=True):
                    col_img, col_txt = st.columns([1, 3])
                    
                    # Coluna da Imagem
                    with col_img:
                        caminho_foto = peca.get('imagem_ref')
                        if caminho_foto and os.path.isfile(caminho_foto):
                            st.image(caminho_foto, use_container_width=True)
                        else:
                            st.info("Imagem não disponível")
                            
                    # Coluna dos Dados Detalhados
                    with col_txt:
                        st.subheader(peca.get('descricao', 'Sem nome'))
                        
                        # Linha 1: Código e Página
                        c1, c2 = st.columns(2)
                        c1.markdown(f"**🔢 Código:** `{peca.get('codigo', 'N/A')}`")
                        c2.markdown(f"**📄 Página PDF:** {peca.get('pagina', 'N/A')}")
                        
                        # Linha 2: Item e Seção
                        c3, c4 = st.columns(2)
                        c3.markdown(f"**📍 Item:** {peca.get('ref', 'N/A')}")
                        c4.markdown(f"**📂 Seção:** {peca.get('secao', 'N/A')}")

                        # Quantidades (Tratando campo aninhado)
                        qtd_info = peca.get('quantidade', {})
                        q_val = qtd_info.get('valor', 'N/A')
                        q_tipo = qtd_info.get('tipo', 'un')
                        q_a = qtd_info.get('A')
                        q_b = qtd_info.get('B')
                        q_c = qtd_info.get('C')
                        if(q_tipo == 'multipla'):
                            st.info(f"**📦 Quantidade Detalhada:** A: {q_a}, B: {q_b}, C: {q_c}  ({q_tipo})")
                        else:
                            st.info(f"**📦 Quantidade:** {q_val}  ({q_tipo})")
                        

                        # Observação
                        obs = peca.get('observacao')
                        if obs and obs != "(empty)":
                            st.warning(f"**⚠️ Obs:** {obs}")

        else:
            st.warning("Nenhum resultado encontrado para essa pesquisa.")

    # AQUI estava o erro: faltava este bloco para fechar o 'try' lá de cima
    except Exception as e:
        st.error(f"Erro na conexão ou na busca: {e}")

else:
    st.info("Digite o termo de busca para localizar as peças no catálogo.")