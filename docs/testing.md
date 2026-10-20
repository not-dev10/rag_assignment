# Test Plan

## 1. Testing layers

-   **Python unit tests:** parsing, chunking, embedding adapter
    behavior, retrieval threshold, fallback, citation metadata.
-   **Node unit/API tests:** validation, upload limits, Python client
    timeouts, safe error mapping.
-   **Frontend tests:** empty input, loading state, answer rendering,
    source rendering, upload errors.
-   **Integration tests:** Node-to-Python happy path and failure path.
-   Mock embedding and LLM providers in automated tests to keep tests
    deterministic and avoid paid API usage.

## 2. Required scenarios

  --------------------------------------------------------------------------
  ID                      Scenario                Expected result
  ----------------------- ----------------------- --------------------------
  T01                     Question answer is      Grounded answer with valid
                          explicitly in a         source
                          document                

  T02                     Question is unrelated   Fallback; no guessed
                          to all documents        answer

  T03                     Empty/whitespace        Validation error; no model
                          question                call

  T04                     Empty vector index      No-evidence response

  T05                     Unsupported file        Clear upload rejection

  T06                     File extracts no text   Ingestion fails; not
                                                  marked ready

  T07                     Chunk                   Chunks obey configured
                          boundaries/overlap      size and overlap

  T08                     PDF citation metadata   Correct page and filename

  T09                     Text file citation      Filename and
                                                  chunk/section; no invented
                                                  page

  T10                     Embedding provider      Controlled service error
                          unavailable             

  T11                     LLM provider timeout    Controlled error; no fake
                                                  answer

  T12                     Qdrant unavailable    Controlled
                                                  retrieval/ingestion error

  T13                     Same file ingested      No duplicate chunks
                          twice                   

  T14                     Document deleted        All chunks for document
                                                  removed

  T15                     Source contains prompt  Content treated as data,
                          injection               not system instructions

  T16                     Node cannot reach       `AI_SERVICE_UNAVAILABLE`
                          Python                  response

  T17                     Oversized upload        Rejected before forwarding

  T18                     Citation ID is not in   Citation omitted/rejected;
                          retrieved set           never fabricated
  --------------------------------------------------------------------------

## 3. Example test ideas

Python:

``` python
def test_unanswerable_question_returns_fallback(qa_service):
    qa_service.retrieve = lambda question: []
    result = qa_service.ask("What is not mentioned in these files?")
    assert result.status == "fallback"
    assert result.sources == []
```

Node:

``` typescript
it("rejects an empty question", async () => {
  const response = await request(app)
    .post("/api/ask")
    .send({ question: "   " });

  expect(response.status).toBe(400);
});
```

Adapt examples to the actual service interfaces and response schemas.

## 4. Manual smoke test

1.  Start Python AI service, Node API, and Next.js frontend.
2.  Upload a short document with two or three clear facts.
3.  Ask a question answered by that document.
4.  Verify the answer and source excerpt.
5.  Ask a question absent from the document.
6.  Verify the fallback contains no guessed facts.
7.  Submit an empty question.
8.  Stop the Python service and verify the Node API returns a safe
    dependency error.
9.  Restart the services and verify the Qdrant index persists.
