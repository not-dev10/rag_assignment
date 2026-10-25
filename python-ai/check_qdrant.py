from qdrant_client import QdrantClient

client = QdrantClient(path='./data/qdrant_db')
collections = client.get_collections()
print('Collections:', [c.name for c in collections.collections])

if collections.collections:
    col = client.get_collection('knowledge_chunks')
    print(f'\nCollection "knowledge_chunks":')
    print(f'  Points count: {col.points_count}')
    print(f'  Vector size: {col.config.params.vectors.size}')
    
    # Try to retrieve a few points
    result = client.scroll(
        collection_name='knowledge_chunks',
        limit=3,
        with_payload=True,
        with_vectors=False
    )
    
    print(f'\nSample points:')
    for point in result[0]:
        print(f'  - ID: {point.id}')
        print(f'    File: {point.payload.get("filename", "N/A")}')
        print(f'    Text: {point.payload.get("text", "")[:80]}...')
