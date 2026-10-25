#!/usr/bin/env python3
"""
Quick Performance Monitoring Script
Tests critical path latencies and reports bottlenecks
"""

import sys
import time
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.vector_store import get_vector_store
from app.services.embeddings import get_embedding_provider
from app.config import settings


async def measure_embedding_latency():
    """Measure embedding generation latency"""
    print("\n🔍 Testing Embedding Generation Latency...")
    provider = get_embedding_provider()
    
    test_texts = [
        "What is machine learning?",
        "Explain quantum computing in simple terms",
        "How does RAG work?"
    ]
    
    latencies = []
    for text in test_texts:
        start = time.perf_counter()
        try:
            await provider.embed_query(text)
            latency = (time.perf_counter() - start) * 1000
            latencies.append(latency)
            print(f"  ✅ Query embedded in {latency:.1f}ms")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    if latencies:
        avg = sum(latencies) / len(latencies)
        print(f"\n  Average: {avg:.1f}ms")
        if avg < 100:
            print(f"  ✅ Excellent (local model)")
        elif avg < 500:
            print(f"  ✅ Good (fast API)")
        elif avg < 2000:
            print(f"  ⚠️  Moderate (API latency)")
        else:
            print(f"  🔴 Slow (API bottleneck)")


async def measure_search_latency():
    """Measure Qdrant search latency"""
    print("\n🔍 Testing Qdrant Search Latency...")
    vector_store = get_vector_store()
    
    # Create a random query vector
    import random
    query_vector = [random.random() for _ in range(1536)]
    
    latencies = []
    for i in range(5):
        start = time.perf_counter()
        try:
            results = vector_store.search(query_vector, top_k=4)
            latency = (time.perf_counter() - start) * 1000
            latencies.append(latency)
            print(f"  ✅ Search {i+1} completed in {latency:.1f}ms ({len(results)} results)")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    if latencies:
        avg = sum(latencies) / len(latencies)
        min_lat = min(latencies)
        max_lat = max(latencies)
        print(f"\n  Average: {avg:.1f}ms")
        print(f"  Min: {min_lat:.1f}ms | Max: {max_lat:.1f}ms")
        if avg < 50:
            print(f"  ✅ Excellent (local)")
        elif avg < 200:
            print(f"  ✅ Good (same region)")
        elif avg < 500:
            print(f"  ⚠️  Moderate (cross-region)")
        else:
            print(f"  🔴 Slow (high network latency)")


async def measure_end_to_end():
    """Measure full query pipeline"""
    print("\n🔍 Testing End-to-End Query Latency...")
    
    from app.services.retrieval import retrieve_chunks
    from app.services.generation import generate_answer
    
    query = "What is artificial intelligence?"
    
    print(f"  Query: '{query}'")
    
    start = time.perf_counter()
    
    # Step 1: Retrieval
    retrieval_start = time.perf_counter()
    try:
        chunks = await retrieve_chunks(query)
        retrieval_time = (time.perf_counter() - retrieval_start) * 1000
        print(f"  ✅ Retrieval: {retrieval_time:.1f}ms ({len(chunks)} chunks)")
    except Exception as e:
        print(f"  ❌ Retrieval failed: {e}")
        return
    
    # Step 2: Generation
    generation_start = time.perf_counter()
    try:
        answer, status, sources, context = await generate_answer(query, chunks)
        generation_time = (time.perf_counter() - generation_start) * 1000
        print(f"  ✅ Generation: {generation_time:.1f}ms")
        print(f"     Status: {status.value}")
        print(f"     Answer length: {len(answer)} chars")
    except Exception as e:
        print(f"  ❌ Generation failed: {e}")
        return
    
    total_time = (time.perf_counter() - start) * 1000
    print(f"\n  Total: {total_time:.1f}ms")
    
    if total_time < 1000:
        print(f"  ✅ Excellent (<1s)")
    elif total_time < 3000:
        print(f"  ✅ Good (<3s)")
    elif total_time < 5000:
        print(f"  ⚠️  Acceptable (<5s)")
    else:
        print(f"  🔴 Too slow (>5s)")


async def main():
    print("=" * 70)
    print("RAG SYSTEM PERFORMANCE MONITORING")
    print("=" * 70)
    print(f"Qdrant: {settings.QDRANT_URL}")
    print(f"LLM Provider: {settings.LLM_PROVIDER}")
    print(f"LLM Model: {settings.LLM_MODEL}")
    print("=" * 70)
    
    try:
        await measure_embedding_latency()
    except Exception as e:
        print(f"\n❌ Embedding test failed: {e}")
    
    try:
        await measure_search_latency()
    except Exception as e:
        print(f"\n❌ Search test failed: {e}")
    
    try:
        await measure_end_to_end()
    except Exception as e:
        print(f"\n❌ End-to-end test failed: {e}")
    
    print("\n" + "=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    print("If embeddings are slow (>500ms):")
    print("  → Use local embeddings model (sentence-transformers)")
    print("  → Or cache embeddings for common queries")
    print()
    print("If search is slow (>200ms):")
    print("  → Use local Qdrant or same-region deployment")
    print("  → Or add Redis cache for frequent searches")
    print()
    print("If generation is slow (>3s):")
    print("  → Implement streaming responses")
    print("  → Or use faster LLM model")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
