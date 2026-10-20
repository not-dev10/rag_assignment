# Product Requirements Document (PRD)

## 1. Product overview

Build a document-grounded Retrieval-Augmented Generation (RAG)
application. Users upload a small collection of PDFs, Markdown, or text
files and ask questions. Answers must use retrieved evidence, cite
sources, and abstain when the documents do not provide enough
information.

## 2. Architecture and stack

This is a three-service application: - **Frontend:** Next.js App Router,
TypeScript, Tailwind CSS. - **Backend API:** Node.js, Express.js,
TypeScript. - **AI service:** Python + FastAPI, running in a dedicated
`.venv`. - **Vector store:** Qdrant, using local Docker or Qdrant Cloud. -
**Models:** Configurable embedding and LLM providers, accessed only from
the Python AI service.

The Node API is the frontend's single entry point. It validates requests
and files, manages API-level concerns, and calls the Python service over
an internal HTTP API. The Next.js application never calls the AI
provider directly.

## 3. Goals

-   Ingest a small set of supported documents.
-   Extract text, chunk it, generate embeddings, and persist searchable
    vectors.
-   Retrieve relevant chunks for each question.
-   Generate answers strictly grounded in retrieved context.
-   Display valid source references with excerpts.
-   Return a clear fallback for unsupported questions.
-   Handle empty input, missing documents, and provider failures.
-   Provide automated tests for answerable and unanswerable questions.

## 4. Out of scope

-   Enterprise multi-tenancy and advanced role-based access control.
-   Web crawling and live internet search.
-   Model fine-tuning.
-   Complex agent orchestration.
-   Guaranteed OCR support for scanned PDFs in the first version.
-   Production-scale deployment and monitoring.

## 5. User stories

1.  As a user, I can upload supported documents and see ingestion
    status.
2.  As a user, I can ask a question in natural language and receive a
    grounded answer.
3.  As a user, I can inspect the document and section/page supporting an
    answer.
4.  As a user, I get an explicit fallback when the documents do not
    answer the question.
5.  As a user, I get understandable errors for invalid input or
    unavailable services.
6.  As a developer, I can test retrieval, citations, fallback behavior,
    and failures independently.

## 6. Functional requirements

### FR-1: Upload and ingestion

-   Initially support `.pdf`, `.md`, and `.txt`.
-   Enforce file size and type limits.
-   Extract text and reject empty/unreadable files.
-   Report status for each uploaded document.
-   Avoid duplicate chunks when the same document is ingested again.

### FR-2: Chunking and metadata

-   Split text at paragraph or sentence boundaries where practical.
-   Use configurable chunk size and overlap.
-   Preserve filename, document ID, chunk index, and page/section
    information where available.
-   Do not index blank chunks.

### FR-3: Embeddings and vector storage

-   Generate embeddings using a configurable model.
-   Use the same embedding model for documents and questions.
-   Store vectors, chunk text, and metadata in persistent Qdrant.
-   Handle embedding and vector-store failures without leaving partial
    documents marked as ready.

### FR-4: Retrieval and evidence check

-   Retrieve configurable top-k chunks.
-   Return source metadata and relevance/distance values where
    available.
-   Use a calibrated relevance threshold and/or evidence check.
-   If retrieval fails, return an error rather than asking the LLM to
    guess.

### FR-5: Answer generation

-   The Python service sends the question and retrieved passages to the
    configured LLM.
-   The model must answer only from the provided context.
-   It must not invent facts, citations, filenames, page numbers, or
    quotations.
-   Every answer should include source identifiers that the application
    can validate.

### FR-6: Fallback

If the index is empty, evidence is irrelevant, or the context cannot
answer the question, return: \> I couldn't find enough information in
the uploaded documents to answer that reliably. Try rephrasing the
question or adding a relevant document.

### FR-7: API

The Node API provides: - `POST /api/documents` --- upload and index a
document through the Python service. - `GET /api/documents` --- list
document metadata and status. - `DELETE /api/documents/:documentId` ---
delete a document and its indexed chunks. - `POST /api/ask` --- submit a
question and return answer, status, and citations. - `GET /api/health`
--- report Node API and Python AI-service health.

### FR-8: Error handling

Handle empty questions, unsupported files, empty extracted text,
oversized uploads, empty index, embedding errors, LLM timeouts,
retrieval errors, and unavailable Python service. Do not return secrets
or stack traces to the browser.

## 7. Non-functional requirements

-   **Grounding:** factual answer claims must be supported by retrieved
    text.
-   **Reliability:** expected failures return stable error codes and
    safe messages.
-   **Maintainability:** frontend, API orchestration, and AI logic
    remain separate.
-   **Privacy:** secrets stay in environment variables; uploaded content
    is not logged unnecessarily.
-   **Accessibility:** labelled controls, keyboard access, visible
    focus, and readable status messages.
-   **Configuration:** providers, model names, chunking settings, and
    retrieval settings are environment-driven.

## 8. Acceptance criteria

-   Supported documents can be uploaded and indexed.
-   A question answered in the documents returns a grounded answer with
    valid citations.
-   An unanswerable question returns the fallback and no fabricated
    source.
-   Empty questions are rejected.
-   Missing documents and unavailable services produce useful errors.
-   Re-ingesting a file does not create duplicate chunks.
-   Tests cover successful ingestion, retrieval, citations, fallback,
    and service failures.
-   README instructions enable a reviewer to run all three services
    locally.
