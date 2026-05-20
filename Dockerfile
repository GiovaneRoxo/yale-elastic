# Usa uma imagem leve do Python
FROM python:3.11-slim

# Define a pasta de trabalho na raiz do container
WORKDIR /app

# Instala dependências (copiando apenas o arquivo necessário primeiro para cachear)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte (ajuste conforme a estrutura da sua pasta)
COPY src/ ./src/

# Define o PYTHONPATH para a pasta onde o 'src' está
ENV PYTHONPATH=/app/src

# O comando aponta para 'src.backend.main:app'
# Ajuste o caminho conforme o nome da pasta principal dentro de src
CMD ["uvicorn", "src.backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]