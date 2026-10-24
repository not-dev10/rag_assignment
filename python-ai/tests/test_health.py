import pytest
from httpx import AsyncClient, ASGITransport
from python_ai.app.main import app


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
async def test_ask_empty_question(client):
    response = await client.post('/ask', json={'question': '   '})
    assert response.status_code == 400
    data = response.json()
    assert data['error']['code'] == 'INVALID_QUESTION'


@pytest.mark.asyncio
async def test_ask_missing_question(client):
    response = await client.post('/ask', json={})
    assert response.status_code == 400