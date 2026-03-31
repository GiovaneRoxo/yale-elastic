# Yale Elastic - Catalogo Inteligente de Pecas

Aplicacao full-stack para consulta de pecas de empilhadeiras com busca via Elasticsearch.

O projeto possui:
- **Backend** em FastAPI (autenticacao, APIs de pecas e catalogos, usuario logado)
- **Frontend** em React + Vite (login, selecao de maquinas e listagem de pecas)
- **Elasticsearch** para indexacao e busca textual
- **Kibana** para inspecao do indice
- **SQLite** para usuarios e autenticacao

## Sumario

- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Pre-requisitos](#pre-requisitos)
- [Configuracao de ambiente](#configuracao-de-ambiente)
- [Como rodar com Docker (recomendado)](#como-rodar-com-docker-recomendado)
- [Como rodar local sem Docker](#como-rodar-local-sem-docker)
- [Carga de dados no Elasticsearch](#carga-de-dados-no-elasticsearch)
- [Fluxo funcional da aplicacao](#fluxo-funcional-da-aplicacao)
- [Principais endpoints](#principais-endpoints)
- [Comandos uteis](#comandos-uteis)
- [Troubleshooting](#troubleshooting)

## Arquitetura

1. Usuario faz login no frontend.
2. Backend valida credenciais no SQLite e devolve JWT.
3. Frontend salva token e envia `Authorization: Bearer <token>` nas requisicoes.
4. Backend valida token e identifica usuario autenticado.
5. Busca de pecas e catalogos acontece no Elasticsearch.
6. Frontend renderiza selecao de maquinas e tabela de pecas.

## Estrutura de pastas

```text
.
├── src/
│   ├── backend/
│   │   ├── core/                 # config e seguranca
│   │   ├── infra/                # sqlite e elasticsearch clients
│   │   ├── modules/
│   │   │   ├── auth/             # login/cadastro
│   │   │   ├── users/            # /users/me
│   │   │   └── parts/            # /api/parts e /api/catalogs
│   │   └── main.py               # app FastAPI
│   └── frontend/                 # app React/Vite
├── tools/
│   ├── data/                     # JSONs de catalogo
│   └── upload/                   # scripts de carga no Elasticsearch
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Pre-requisitos

- Docker e Docker Compose
- Node.js 18+ (ou 20+ recomendado)
- Python 3.11+ (apenas para execucao local sem Docker)

## Configuracao de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
SECRET_KEY=sua_chave_super_secreta_e_longa
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

ELASTIC_URL=http://localhost:9200
INDEX_NAME=yale_a975

DATABASE_URL=sqlite:////app/src/backend/yale.db
```

> Observacoes:
> - No backend, as variaveis sao lidas de `/app/.env` (conforme `core/config.py`).
> - Em execucao com Docker, o volume da raiz do projeto e montado em `/app`.

## Como rodar com Docker (recomendado)

Na raiz do projeto:

```bash
docker compose up -d --build
```

Servicos esperados:
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Elasticsearch: `http://localhost:9200`
- Kibana: `http://localhost:5601`

Para acompanhar logs:

```bash
docker logs -f yale_fastapi
docker logs -f yale-elastic
```

## Como rodar local sem Docker

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ajuste o `.env` para ambiente local (exemplo de SQLite local):

```env
DATABASE_URL=sqlite:///./yale.db
```

Suba o backend:

```bash
cd src/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Se necessario, configure a URL do backend no frontend:

```bash
export VITE_API_URL=http://localhost:8000
```

## Carga de dados no Elasticsearch

Script atual de carga:
- `tools/upload/upload_elastic.py`

Ele le:
- `tools/data/A975_full_catalog.json`

E injeta metadados em cada item:
- `modelo_catalogo`: ex. `A975`
- `maquinas_relacionadas`: ex. `["GLP/GDP 40-70VX"]`

Execucao:

```bash
cd tools/upload
python upload_elastic.py
```

Depois valide no Elasticsearch:

```bash
curl http://localhost:9200/yale_a975/_count
```

## Fluxo funcional da aplicacao

1. **Login/Cadastro**
   - Token JWT e gerado no backend e salvo no frontend.
2. **Selecao de maquinas**
   - Frontend consulta `/api/catalogs`.
   - Mostra lista por `modelo_catalogo` e `maquinas_relacionadas`.
3. **Listagem de pecas**
   - Ao selecionar um catalogo, frontend abre a tela de pecas.
   - Busca inicial usa o modelo selecionado.
   - Endpoint `/api/parts` consulta Elasticsearch com `multi_match`.

## Principais endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Usuario
- `GET /users/me`

### Pecas e catalogos
- `GET /api/catalogs` - lista modelos de catalogo e maquinas relacionadas
- `GET /api/parts?q=<termo>&page=1&limit=20` - busca pecas

## Comandos uteis

```bash
# subir stack
docker compose up -d --build

# derrubar stack
docker compose down

# status containers
docker ps

# rebuild apenas API
docker compose up -d --build api_yale
```

## Troubleshooting

### 1) "Backend em 0.0.0.0:8000 e localhost nao abre"

`0.0.0.0` e apenas bind de rede do processo. O acesso deve ser por:
- `http://localhost:8000`
- `http://127.0.0.1:8000`

### 2) "Nao foi possivel carregar os catalogos"

Verifique:
- backend online (`/docs` abre)
- token de login valido
- indice com documentos contendo `modelo_catalogo`

### 3) Lista de catalogos vazia apos subir ambiente

Provavel falta de carga no Elasticsearch. Rode o script de upload novamente.

### 4) Erro de CORS no frontend

Confirme a porta do Vite em `src/backend/main.py` (`allow_origins`).

### 5) Alterei backend e nao refletiu no Docker

Rode:

```bash
docker compose up -d --build
```

---

Se quiser, no proximo passo eu tambem posso separar este README em:
- `README.md` (visao geral)
- `docs/backend.md`
- `docs/frontend.md`
- `docs/deploy.md`

para facilitar manutencao conforme o projeto crescer.
