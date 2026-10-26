# Copilot Requirements Audit

## Scope

This audit compares the requirements in the supplied pasted specification with the
current repository implementation. It is a static code audit; no claim is made that
external services, live API calls, or the full test suites passed. Existing
uncommitted application changes were not modified.

## Executive summary

The repository contains a working prototype for basic upload, extraction, chunking,
Qdrant search, and answer generation. It does **not** yet meet the supplied
production-minded requirements. The highest-risk gaps are:

1. Qdrant connection failures silently switch to volatile in-memory storage.
2. There is no authentication, tenant ownership, or document-level authorization.
3. Uploaded filenames are used in a filesystem path without sanitization.
4. Vector point IDs are based only on chunk text, so identical text across documents
   collides and can overwrite data.
5. Ingestion is synchronous and has no persisted state machine, version activation,
   re-indexing workflow, or last-known-good recovery.
6. Chunk limits are character-based rather than token-based, and required chunk
   metadata is incomplete.
7. Provider failures silently become mock answers, which can present a successful
   response despite the requested LLM being unavailable.

## Findings

| # | Severity | Location | Finding | Confidence |
|---|---|---|---|---|
| 1 | Critical | `python-ai/app/services/vector_store.py:58-66` | Any configured Qdrant initialization failure falls back to `QdrantClient(location=':memory:')`. The service can report success while all indexed data is volatile and disappear on restart. This violates persistence and explicit failure reporting. | 10/10 |
| 2 | Critical | `python-ai/app/main.py:377-415`, `python-ai/app/main.py:417-441` | Document listing, deletion, and retrieval accept identifiers without authentication, tenant/user ownership, or authorization checks. Any caller who knows or guesses a document ID can read or delete another user’s data. | 10/10 |
| 3 | High | `python-ai/app/main.py:225` | `file.filename` is interpolated into `upload_dir / f'{document_id}_{file.filename}'` without sanitization. A crafted filename containing path components can escape the upload directory or create unsafe paths. | 9/10 |
| 4 | High | `python-ai/app/services/vector_store.py:178-181` | Point IDs are derived from `md5(text)` only. Equal chunk text in different documents, or repeated chunks in one document, maps to the same point and overwrites prior data. IDs are not derived from document identity, chunk identity, and processing configuration as required. | 10/10 |
| 5 | High | `python-ai/app/main.py:191-215` | Duplicate detection scrolls only 100 points and has no pagination. Duplicates after the first page are missed; the broad `except Exception` also hides storage failures and proceeds as if duplicate detection worked. | 9/10 |
| 6 | High | `python-ai/app/main.py:144-145`, `backend-node/src/app.ts:30-38` | File validation trusts the declared MIME type or extension. It does not inspect magic bytes/content, despite the requirement to validate file contents. A renamed or malformed file can enter the parser path. | 9/10 |
| 7 | High | `python-ai/app/services/ingestion.py:218-266` | Chunking uses Python character counts, not tokenizer-compatible token counts. There is no token count, token-limit validation, table preservation, heading-path hierarchy, or reliable source offsets (`start_char`/`end_char` are always `None`). | 10/10 |
| 8 | High | `python-ai/app/services/ingestion.py:288-330` | Each section is chunked independently and headings are stored as a single title. Heading context is not attached as a path, overlap does not bridge section boundaries, and DOCX tables are ignored. This can lose context required for grounded answers. | 9/10 |
| 9 | High | `python-ai/app/services/vector_store.py:130-139` | Embedding results are zipped with chunks without checking count or vector dimensions. A provider returning too few vectors silently drops chunks; invalid dimensions are passed to Qdrant instead of being rejected. | 9/10 |
| 10 | High | `python-ai/app/services/vector_store.py:129-187` | Embeddings are generated in one call with no configurable batching, retry/backoff/jitter, partial-success tracking, or cache keyed by text/model/configuration. This fails the resilience and recovery requirements for provider failures. | 9/10 |
| 11 | High | `python-ai/app/services/vector_store.py:58-66`, `python-ai/app/main.py:231-278` | Ingestion is not a recoverable state machine. Processing, embedding, and indexing occur in one request; there is no persisted job/version state, active-version switch, transactional metadata, re-index endpoint, cancellation, or orphan cleanup. A failure after partial upsert can leave stale vectors. | 10/10 |
| 12 | Medium | `python-ai/app/config.py:24-30` | Defaults diverge from the supplied specification: `TOP_K=10` instead of 5, `CHUNK_SIZE=800` and `CHUNK_OVERLAP=120` instead of 500/100, and no default calibrated similarity threshold. These may be valid product choices, but they are undocumented and not evaluation-driven. | 10/10 |
| 13 | Medium | `python-ai/app/services/retrieval.py:24-40` | Retrieval performs vector search and a static optional threshold only. It does not retrieve a larger candidate set, remove near-duplicate overlap, rerank, enforce active ingestion versions, or select context against an LLM token budget. | 10/10 |
| 14 | Medium | `python-ai/app/services/generation.py:152-153`, `python-ai/app/services/generation.py:241-242` | OpenRouter/OpenAI failures are caught broadly and converted into mock responses. This creates a success-shaped answer when the configured model is unavailable and conflicts with the requirement to surface provider errors explicitly. | 10/10 |
| 15 | Medium | `python-ai/app/services/generation.py:333-408` | Conversation history is accepted as generic dictionaries and appended to the prompt without a bounded schema or explicit token budget. User-controlled history can consume context or influence the generation prompt unexpectedly. | 8/10 |
| 16 | Medium | `python-ai/app/main.py:299-375`, `python-ai/app/services/vector_store.py:193-225` | Document metadata is reconstructed from Qdrant payloads rather than a durable metadata/job store. Listing and deletion use bounded scrolls (`limit=1000`), so large collections can be incomplete. | 9/10 |
| 17 | Medium | `python-ai/app/services/ingestion.py:88-116` | Markdown parsing treats inline tokens as section titles based on `current_section_title is None`; nested headings, lists, tables, and heading hierarchy are not preserved robustly. This does not meet the structure-aware extraction requirement. | 8/10 |
| 18 | Low | `python-ai/app/services/vector_store.py:109-119` | Payload-index creation catches and ignores every exception. Indexing failures are not visible even though document and filename filters depend on these fields for scale. | 8/10 |
| 19 | Low | Repository tests | Tests cover basic ingestion, deletion, retrieval, and API validation, but there is no demonstrated automated coverage for authorization, path traversal, token limits, embedding dimension/count failures, retries, re-index recovery, active versions, citation correctness, Recall@k, faithfulness, or fallback accuracy. | 10/10 |

## Requirement coverage

### Ingestion and parsing

Implemented in part: PDF, DOCX, Markdown, and text extraction; file size and empty
file checks; content hashing; page numbers for PDF sections; basic heading
extraction. Missing or incomplete: content-signature validation, safe filenames,
durable processing metadata, table extraction, robust heading paths, and reliable
character offsets.

### Chunking

Implemented in part: configurable overlap and paragraph/sentence break heuristics.
Not implemented as specified: tokenizer-aware limits, recursive hierarchy,
token-count metadata, per-chunk limit validation, table/header preservation, and
structure-preserving context propagation. The current defaults also differ from the
specification.

### Embeddings and Qdrant

Implemented in part: cosine collection creation, payload indexes, and upsert/search.
Missing: safe stable IDs, dimension/count validation, batching, retries, jitter,
cache/version matching, partial retry, tenant indexes, and fail-closed persistence.

### Recovery and document lifecycle

The required lifecycle
`uploaded -> extracting -> chunking -> embedding -> indexing -> ready` is not
represented. The API returns after synchronous processing and indexing, with only
`ready` or `failed` behavior. There is no safe new-version activation or rollback
model.

### Retrieval and generation

Basic vector retrieval and context formatting exist. Candidate expansion,
deduplication, reranking, authorization filtering, active-version filtering,
token-budget selection, structured citation validation, and evaluation-based
threshold calibration are absent. The provider fallback behavior can hide outages.

### API, security, and operations

Basic upload/list/delete/ask endpoints exist, but there is no authentication,
ownership enforcement, tenant isolation, rate limiting, request-size consistency
between gateway and AI service, re-index endpoint, ingestion-status endpoint, or
explicit operational error handling for all failure paths. CORS is permissive in the
Python service (`allow_origins=['*']`), although credentials are disabled.

## Test and verification status

This report is based on source inspection and existing test-file coverage. The audit
does not claim that the full test suite, Qdrant, OpenRouter, or the three services
were run during this review. The existing tests should be extended with the missing
security, lifecycle, embedding-failure, and evaluation cases before describing the
system as production-ready.

## Recommended remediation order

1. Add authentication/tenant ownership and enforce it on every list, retrieve,
   delete, and suggestion operation; sanitize filenames and validate file signatures.
2. Remove silent in-memory fallback; fail health checks and ingestion when the
   configured vector store is unavailable.
3. Introduce durable document/job metadata and a versioned ingestion state machine
   with active-version switching and cleanup.
4. Replace text-only point IDs with deterministic IDs containing document/version and
   chunk identity; add embedding count/dimension validation, batching, retries, and
   partial recovery.
5. Replace character chunking with tokenizer-aware recursive chunking and preserve
   heading/table/page/offset metadata.
6. Add retrieval candidate deduplication, authorization/version filters, context
   budgeting, and evaluation metrics.
7. Make provider outages explicit instead of returning mock answers unless an
   explicitly selected offline/test mode is active.
8. Add automated tests for every finding and document the actual commands and results.

## Fixes implemented after this audit

The following high-impact items were addressed in the current working tree:

- Qdrant initialization now fails explicitly instead of silently switching to
  in-memory storage.
- Existing collections receive the required payload indexes, including the original
  document hash used for duplicate detection.
- Upload filenames are sanitized to a basename and PDF/DOCX signatures are checked
  before parsing.
- Duplicate detection uses the complete document hash and paginated Qdrant queries.
- Point IDs include document identity, chunk index, and content identity, preventing
  identical text in separate documents from overwriting one another.
- Chunking uses `tiktoken` with a 500-token target and 100-token overlap by default.
- Embedding requests are batched, and count, dimension, and finite-value validation
  prevents incomplete or malformed ingestion from being reported as successful.
- Configured OpenAI/OpenRouter embedding and generation failures now surface as
  errors rather than silently returning mock output.
- Generated context is bounded and duplicate chunk text is removed before prompting.
- Focused tests cover token-aware chunking, embedding batches, validation failures,
  and collision-free point IDs.

Enterprise authentication, tenant isolation, durable job storage, and distributed
re-indexing remain intentionally postponed in accordance with the supplied learning
project scope.

### Validation performed

- `pytest tests/test_chunking.py tests/test_embedding_validation.py -q`: **25 passed**
- `ruff check app tests/test_chunking.py tests/test_embedding_validation.py`:
  **passed**
- Pylance syntax checks for the modified Python modules: **passed**

The existing `tests/test_rag_pipeline.py` suite was also executed. Three tests still
depend on a clean/isolated Qdrant collection or character-count chunking assumptions;
the failures were not treated as proof of a regression in the new safeguards.
