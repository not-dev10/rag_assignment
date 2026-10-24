import pytest
from httpx import AsyncClient, ASGITransport
from backend_node.src.app import create_app


@pytest.fixture
async def app():
    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get('/api/health')
    assert response.status_code in (200, 503)
    data = response.json()
    assert data['status'] == 'ok'
    assert 'service' in data
    assert 'dependencies' in data
    assert 'python_ai' in data['dependencies']


@pytest.mark.asyncio
async def test_ask_empty_question(client):
    response = await client.post('/api/ask', json={'question': '   '})
    assert response.status_code == 400
    data = response.json()
    assert data['error']['code'] == 'INVALID_QUESTION'


@pytest.mark.asyncio
async def test_ask_missing_question(client):
    response = await client.post('/api/ask', json={})
    assert response.status_code == 400