import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get('/health')
    assert response.status_code in (200, 503)
    data = response.json()
    assert data['status'] in ('ok', 'degraded')


@pytest.mark.asyncio
async def test_ask_with_empty_index(client):
    """Empty index should return fallback."""
    response = await client.post('/ask', json={'question': 'What is quantum computing?'})
    # With empty index, should get fallback
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'fallback'
    assert len(data['sources']) == 0


@pytest.mark.asyncio
async def test_ask_missing_question(client):
    response = await client.post('/ask', json={})
    assert response.status_code == 422  # Pydantic validation error