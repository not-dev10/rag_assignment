from typing import List, Optional
from app.config import settings
from app.services.vector_store import get_vector_store
from app.services.embeddings import get_embedding_provider


class RetrievalError(Exception):
    pass


async def retrieve_chunks(
    question: str,
    top_k: int = None,
    document_id: Optional[str] = None,
    document_ids: Optional[List[str]] = None,
) -> List[dict]:
    """
    Retrieve relevant chunks for a question.
    Returns list of dicts with chunk data and similarity scores.
    """
    if top_k is None:
        top_k = settings.TOP_K

    vector_store = get_vector_store()
    embedding_provider = get_embedding_provider()

    try:
        query_vector = await embedding_provider.embed_query(question)
    except Exception as e:
        raise RetrievalError(f'Failed to embed question: {e}')

    try:
        results = vector_store.search(
            query_vector,
            top_k=top_k,
            document_id=document_id,
            document_ids=document_ids,
        )
    except Exception as e:
        raise RetrievalError(f'Vector search failed: {e}')

    # Apply similarity threshold if configured
    if settings.SIMILARITY_THRESHOLD is not None:
        results = [r for r in results if r['score'] >= settings.SIMILARITY_THRESHOLD]

    return results


def format_chunks_for_context(results: List[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    if not results:
        return ''

    context_parts = []
    for i, result in enumerate(results, 1):
        payload = result['payload']
        source_info = f"Source: {payload.get('filename', 'unknown')}"
        if payload.get('page_number'):
            source_info += f" (Page {payload['page_number']})"
        if payload.get('section_title'):
            source_info += f" · {payload['section_title']}"

        context_parts.append(
            f"[Retrieved Chunk #{i}] {source_info}\n{payload.get('text', '')}"
        )

    return '\n\n'.join(context_parts)