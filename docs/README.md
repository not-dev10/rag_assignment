# RAG Developer Internship Assignment

## Stack

-   Frontend: Next.js App Router + TypeScript + Tailwind CSS
-   Backend: Node.js + Express.js + TypeScript
-   AI service: Python + FastAPI in a dedicated virtual environment
-   Vector store: Qdrant
-   Models: configurable embedding and LLM providers

## Repository layout

-   `frontend/` --- Next.js UI
-   `backend-node/` --- public REST API and orchestration
-   `python-ai/` --- ingestion, embeddings, retrieval, and generation
-   `docs/` --- PRD, database design, UI specification, architecture,
    and tests

## Qdrant setup

Choose one option before starting the Python AI service.

### Option A: local Qdrant with Docker

```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v "$(pwd)/qdrant_storage:/qdrant/storage" \
  qdrant/qdrant
```

Set `QDRANT_URL=http://localhost:6333` and leave `QDRANT_API_KEY` empty for a local instance. Keep the `qdrant_storage/` directory out of version control.

### Option B: Qdrant Cloud

Create a cluster in [Qdrant Cloud](https://cloud.qdrant.io/), then set `QDRANT_URL` to the cluster URL and `QDRANT_API_KEY` to the generated key in `python-ai/.env`. Never put the key in the frontend environment or commit it.

Install the Python client in the virtual environment:

```bash
pip install qdrant-client
```

Use the service-specific environment templates (`python-ai.env.example`, `backend-node.env.example`, and `frontend.env.example`) as the starting point for each service.

## Local development order

1.  Create and configure the Python virtual environment in
    `python-ai/.venv`.
2.  Install Python dependencies from `python-ai/requirements.txt`.
3.  Start the FastAPI AI service on a local port.
4.  Install Node dependencies in `backend-node/`, configure the Python
    service URL, and start Express.
5.  Install frontend dependencies in `frontend/`, configure the Node API
    URL, and start Next.js.
6.  Upload a sample document, test a supported question, and test an
    unrelated question.
7.  Run Python, Node, and frontend tests.

## Environment variables

Keep provider keys in `python-ai/.env` and keep that file out of version
control. Node should have only service URLs and API configuration it
needs. The frontend must not expose model keys through `NEXT_PUBLIC_*`.

## Assignment acceptance checklist

-   [ ] Document ingestion and chunking work.
-   [ ] Embeddings and vector retrieval work.
-   [ ] Answers are grounded in retrieved context.
-   [ ] Sources identify the supporting document and available
    section/page.
-   [ ] Unanswerable questions receive a fallback.
-   [ ] Empty input and service failures are handled.
-   [ ] Tests cover answerable and unanswerable questions.
