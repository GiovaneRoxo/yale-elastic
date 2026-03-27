# Usa uma imagem leve do Python
FROM python:3.11-slim

# Define a pasta de trabalho
WORKDIR /app

# Copia os requisitos e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia TODA a pasta api para dentro do container
COPY  . .

ENV PYTHONPATH=/app/src

# O comando agora aponta para o 'main' dentro do pacote 'api'
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]