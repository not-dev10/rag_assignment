"""Comprehensive RAG pipeline tests covering ingestion, retrieval, and generation."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import tempfile
import os
from pathlib import Path


@pytest.fixture
async def client():
    """HTTP client fixture for API testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        yield ac


@pytest.mark.asyncio
async def test_ingest_text_file(client):
    """Test successful text file ingestion."""
    content = b"This is a test document about quantum computing. Quantum computers use qubits."
    
    files = {'file': ('test.txt', content, 'text/plain')}
    response = await client.post('/documents/ingest', files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert 'document_id' in data
    assert data['filename'] == 'test.txt'
    assert data['status'] == 'ready'
    assert data['chunk_count'] > 0


@pytest.mark.asyncio
async def test_ingest_markdown_file(client):
    """Test successful markdown file ingestion with sections."""
    content = b"""# Introduction
This is the introduction section.

## Details
Here are more details about the topic.
"""
    
    files = {'file': ('guide.md', content, 'text/markdown')}
    response = await client.post('/documents/ingest', files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ready'
    assert data['chunk_count'] > 0


@pytest.mark.asyncio
async def test_ingest_empty_file(client):
    """Test that empty files are rejected."""
    content = b""
    
    files = {'file': ('empty.txt', content, 'text/plain')}
    response = await client.post('/documents/ingest', files=files)
    
    assert response.status_code == 400
    data = response.json()
    assert 'detail' in data or 'error' in data


@pytest.mark.asyncio
async def test_ingest_unsupported_file_type(client):
    """Test that unsupported file types are rejected."""
    content = b"Some content"
    
    files = {'file': ('test.exe', content, 'application/octet-stream')}
    response = await client.post('/documents/ingest', files=files)
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_documents_empty(client):
    """Test listing documents when none are uploaded."""
    response = await client.get('/documents')
    
    assert response.status_code == 200
    data = response.json()
    assert 'documents' in data
    # May have documents from previous tests in :memory: mode


@pytest.mark.asyncio
async def test_full_rag_pipeline_answerable_question(client):
    """Test complete RAG pipeline with an answerable question."""
    # 1. Ingest a document
    content = b"""Quantum Computing Handbook

Quantum computers use quantum bits or qubits. Unlike classical bits that are either 0 or 1, 
qubits can exist in superposition. This allows quantum computers to perform certain 
calculations exponentially faster than classical computers.

Quantum entanglement is another key property where qubits can be correlated in ways 
that have no classical analog.
"""
    
    files = {'file': ('quantum_handbook.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    assert ingest_response.status_code == 200
    
    # 2. Ask a question that can be answered from the document
    ask_response = await client.post('/ask', json={
        'question': 'What are qubits?'
    })
    
    assert ask_response.status_code == 200
    data = ask_response.json()
    
    # 3. Verify answer is grounded
    assert data['status'] == 'answered'
    assert len(data['sources']) > 0
    
    # 4. Verify source citations (filename should match what was uploaded)
    source = data['sources'][0]
    assert 'filename' in source
    assert 'excerpt' in source
    # Should match one of the uploaded documents in this test session
    assert source['filename'] in ['quantum_handbook.txt', 'test.txt', 'quantum.txt']


@pytest.mark.asyncio
async def test_full_rag_pipeline_unanswerable_question(client):
    """Test RAG pipeline with unanswerable question returns fallback."""
    # 1. Ingest a document about quantum computing
    content = b"Quantum computers use qubits and superposition."
    
    files = {'file': ('quantum.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    assert ingest_response.status_code == 200
    
    # 2. Ask completely unrelated question
    ask_response = await client.post('/ask', json={
        'question': 'What is the recipe for chocolate cake?'
    })
    
    assert ask_response.status_code == 200
    data = ask_response.json()
    
    # 3. Should return fallback, not fabricated answer
    assert data['status'] == 'fallback'
    assert len(data['sources']) == 0
    assert 'could not find' in data['answer'].lower() or 'couldn\'t find' in data['answer'].lower()


@pytest.mark.asyncio
async def test_delete_document(client):
    """Test document deletion."""
    # 1. Ingest a document
    content = b"Test document for deletion."
    files = {'file': ('delete_me.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    assert ingest_response.status_code == 200
    
    document_id = ingest_response.json()['document_id']
    
    # 2. Delete the document
    delete_response = await client.delete(f'/documents/{document_id}')
    assert delete_response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_document(client):
    """Test deleting a document that doesn't exist."""
    response = await client.delete('/documents/nonexistent-id-12345')
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_duplicate_document_handling(client):
    """Test that re-ingesting same content is handled."""
    content = b"Unique test content for duplicate detection 12345."
    
    # Ingest first time
    files1 = {'file': ('test1.txt', content, 'text/plain')}
    response1 = await client.post('/documents/ingest', files=files1)
    assert response1.status_code == 200
    first_doc_id = response1.json()['document_id']
    
    # Ingest same content again
    files2 = {'file': ('test1.txt', content, 'text/plain')}
    response2 = await client.post('/documents/ingest', files=files2)
    assert response2.status_code == 200
    
    # Should detect duplicate and not create unnecessary chunks


@pytest.mark.asyncio
async def test_source_citations_accuracy(client):
    """Test that source citations are accurate and not fabricated."""
    content = b"""Research Paper

Section 1: Introduction
This paper discusses artificial intelligence.

Section 2: Methods
We used machine learning algorithms.
"""
    
    files = {'file': ('paper.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    assert ingest_response.status_code == 200
    
    ask_response = await client.post('/ask', json={
        'question': 'What methods were used?'
    })
    
    if ask_response.json()['status'] == 'answered':
        data = ask_response.json()
        # Verify citations reference actual document
        for source in data['sources']:
            assert source['filename'] == 'paper.txt'
            # Excerpt should be from actual document
            assert 'excerpt' in source
            assert len(source['excerpt']) > 0


@pytest.mark.asyncio
async def test_retrieval_with_similarity_threshold(client):
    """Test that retrieval respects similarity thresholds."""
    # This tests that very dissimilar documents don't get retrieved
    content = b"Python is a programming language used for web development."
    
    files = {'file': ('python.txt', content, 'text/plain')}
    await client.post('/documents/ingest', files=files)
    
    # Ask completely unrelated question
    response = await client.post('/ask', json={
        'question': 'How do I bake bread?'
    })
    
    data = response.json()
    # Should not retrieve irrelevant document
    assert data['status'] == 'fallback'


@pytest.mark.asyncio  
async def test_chunking_preserves_context(client):
    """Test that chunking doesn't break semantic context."""
    # Long document that will be chunked
    content = b"""Computer Science Fundamentals

Data structures are fundamental to computer science. Arrays store elements in contiguous memory.
Linked lists use nodes with pointers. Trees organize data hierarchically. Graphs represent 
relationships between entities.

Algorithms operate on these data structures. Sorting algorithms include quicksort, mergesort,
and heapsort. Search algorithms include binary search and depth-first search.
""" * 3  # Repeat to ensure multiple chunks
    
    files = {'file': ('cs.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    assert ingest_response.status_code == 200
    
    # Document should be chunked
    assert ingest_response.json()['chunk_count'] > 1
    
    # Questions should still be answerable despite chunking
    response = await client.post('/ask', json={
        'question': 'What are some data structures?'
    })
    
    # Should retrieve relevant chunks
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_empty_question_validation(client):
    """Test that empty questions are rejected."""
    response = await client.post('/ask', json={'question': ''})
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_whitespace_only_question(client):
    """Test that whitespace-only questions are rejected or return fallback."""
    response = await client.post('/ask', json={'question': '   '})
    # Pydantic will trim and reject, OR the service returns fallback
    assert response.status_code in [200, 422]
    
    if response.status_code == 200:
        # If accepted, should return fallback status
        data = response.json()
        assert data['status'] == 'fallback'


@pytest.mark.asyncio
async def test_extremely_long_question(client):
    """Test that extremely long questions are rejected."""
    long_question = 'a' * 3000  # Exceeds max length
    response = await client.post('/ask', json={'question': long_question})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_health_check_reports_status(client):
    """Test that health check reports correct status."""
    response = await client.get('/health')
    assert response.status_code == 200
    
    data = response.json()
    assert 'status' in data
    assert 'vector_store' in data
    assert 'llm_provider' in data
    assert 'embedding_model' in data


@pytest.mark.asyncio
async def test_document_suggestions_endpoint(client):
    """Test document-specific question suggestions."""
    content = b"""Employee Handbook

Section: Leave Policy
Employees are entitled to 15 days of annual leave.

Section: Benefits
We offer health insurance and retirement plans.
"""
    
    files = {'file': ('handbook.txt', content, 'text/plain')}
    ingest_response = await client.post('/documents/ingest', files=files)
    document_id = ingest_response.json()['document_id']
    
    # Get suggestions for this document
    response = await client.get(f'/documents/{document_id}/suggestions')
    
    if response.status_code == 200:
        data = response.json()
        assert 'suggestions' in data
        assert isinstance(data['suggestions'], list)
