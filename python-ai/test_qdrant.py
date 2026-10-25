#!/usr/bin/env python3
"""Quick script to test Qdrant connection and ensure collection exists."""

import sys
import logging
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.vector_store import get_vector_store
from app.config import settings

logging.basicConfig(level=logging.INFO)

def main():
    print("=" * 60)
    print("QDRANT CONNECTION TEST")
    print("=" * 60)
    print(f"QDRANT_URL: {settings.QDRANT_URL}")
    print(f"QDRANT_COLLECTION: {settings.QDRANT_COLLECTION}")
    print()
    
    try:
        vector_store = get_vector_store()
        print("✓ Vector store connected successfully")
        
        # Try to get collection info
        collections = vector_store.client.get_collections()
        print(f"✓ Collections found: {len(collections.collections)}")
        
        for col in collections.collections:
            print(f"  - {col.name}")
        
        # Check if our collection exists
        try:
            col_info = vector_store.client.get_collection(settings.QDRANT_COLLECTION)
            print(f"\n✓ Collection '{settings.QDRANT_COLLECTION}' exists")
            print(f"  Dimension: {col_info.config.params.vectors.size}")
            print(f"  Distance: {col_info.config.params.vectors.distance}")
            print(f"  Points count: {col_info.points_count}")
        except Exception as e:
            print(f"\n✗ Collection '{settings.QDRANT_COLLECTION}' not found: {e}")
            print("  This is normal if no documents have been uploaded yet.")
            print("  The collection will be created automatically on first upload.")
        
        print("\n✓ Qdrant is working correctly!")
        return 0
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
