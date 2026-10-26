import pytest

from app.schemas import AskStatus
from app.services import generation, retrieval
from app.services.generation import FALLBACK_MESSAGE, generate_answer


class FakeLLM:
    def __init__(self, answer='Grounded answer'):
        self.answer = answer
        self.calls = []

    async def generate(self, prompt, context, question):
        self.calls.append({'prompt': prompt, 'context': context, 'question': question})
        return self.answer


def result(point_id, filename, text, score=0.9):
    return {
        'id': point_id,
        'score': score,
        'payload': {
            'filename': filename,
            'text': text,
            'page_number': 2,
            'section_title': 'Methods',
        },
    }


@pytest.mark.asyncio
async def test_answerable_chatbot_question_returns_grounded_citations(monkeypatch):
    llm = FakeLLM('The method uses vector search.')
    monkeypatch.setattr(generation, 'get_llm_provider', lambda: llm)

    answer, status, sources, context = await generate_answer(
        'What method is used?',
        [result('chunk-1', 'paper.txt', 'The method uses vector search.')],
    )

    assert status == AskStatus.ANSWERED
    assert answer == 'The method uses vector search.'
    assert len(sources) == 1
    assert sources[0].filename == 'paper.txt'
    assert sources[0].page_number == 2
    assert 'The method uses vector search.' in context


@pytest.mark.asyncio
async def test_unanswerable_chatbot_question_abstains_without_sources():
    answer, status, sources, context = await generate_answer('What is unrelated?', [])

    assert status == AskStatus.FALLBACK
    assert answer == FALLBACK_MESSAGE
    assert sources == []
    assert context == ''


@pytest.mark.asyncio
async def test_chatbot_context_removes_duplicate_chunks_and_is_bounded(monkeypatch):
    llm = FakeLLM()
    monkeypatch.setattr(generation, 'get_llm_provider', lambda: llm)
    monkeypatch.setattr('app.config.settings.MAX_CONTEXT_CHARS', 220)

    duplicate = 'Same evidence appears twice.'
    _, status, sources, context = await generate_answer(
        'Summarize the evidence.',
        [
            result('chunk-1', 'a.txt', duplicate),
            result('chunk-2', 'a.txt', duplicate),
            result('chunk-3', 'b.txt', 'Additional evidence that should be truncated.'),
        ],
    )

    assert status == AskStatus.ANSWERED
    assert len(sources) == 2
    assert context.count(duplicate) == 1
    assert len(context) <= 220


@pytest.mark.asyncio
async def test_chatbot_conversation_history_is_limited_to_recent_turns(monkeypatch):
    llm = FakeLLM()
    monkeypatch.setattr(generation, 'get_llm_provider', lambda: llm)

    history = [
        {'question': f'old question {i}', 'answer': f'old answer {i}'}
        for i in range(5)
    ]
    await generate_answer('Current question', [result('chunk-1', 'paper.txt', 'Evidence')], history)

    prompt = llm.calls[0]['prompt']
    assert 'old question 0' not in prompt
    assert 'old question 1' not in prompt
    assert 'old question 2' in prompt
    assert 'old question 4' in prompt


@pytest.mark.asyncio
async def test_retrieval_passes_selected_document_ids_to_vector_store(monkeypatch):
    class FakeEmbedding:
        async def embed_query(self, question):
            return [1.0, 0.0]

    class FakeStore:
        def __init__(self):
            self.received = None

        def search(self, query_vector, top_k, document_id=None, document_ids=None):
            self.received = (query_vector, top_k, document_id, document_ids)
            return []

    store = FakeStore()
    monkeypatch.setattr(retrieval, 'get_vector_store', lambda: store)
    monkeypatch.setattr(retrieval, 'get_embedding_provider', lambda: FakeEmbedding())

    await retrieval.retrieve_chunks(
        'question',
        document_id='doc-one',
        document_ids=['doc-one', 'doc-two'],
    )

    assert store.received[2] == 'doc-one'
    assert store.received[3] == ['doc-one', 'doc-two']
