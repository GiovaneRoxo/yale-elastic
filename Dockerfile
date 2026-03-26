# Usa uma imagem oficial e enxuta do Python
FROM python:3.11-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os requisitos e instala (o --no-cache-dir deixa a imagem menor)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia a nossa API
COPY api.py .

# Comando para rodar o garçom, liberando a porta para o mundo externo (0.0.0.0)
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]