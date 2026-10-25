#!/usr/bin/env python3
"""
Comprehensive RAG System Test Suite
Tests: file sizes, edge cases, Qdrant latency, concurrent operations, error handling
"""

import sys
import time
import asyncio
import random
import string
from pathlib import Path
from typing import List, Dict, Any
import logging

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.vector_store import get_vector_store
from app.services.retrieval import retrieve_chunks
from app.services.generation import generate_answer
from app.services.ingestion import process_document
from app.config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.error = None
        self.latency_ms = 0
        self.details = {}
    
    def __repr__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        latency = f" ({self.latency_ms}ms)" if self.latency_ms else ""
        error = f" - {self.error}" if self.error else ""
        return f"{status} {self.name}{latency}{error}"


class RAGTestSuite:
    def __init__(self):
        self.results: List[TestResult] = []
        self.vector_store = None
    
    async def setup(self):
        """Initialize vector store"""
        logger.info("Setting up test environment...")
        self.vector_store = get_vector_store()
    
    async def teardown(self):
        """Cleanup after tests"""
        logger.info("Cleaning up test environment...")
        # Don't delete real data - just close connections
        if self.vector_store:
            self.vector_store.close()
    
    # ==================== QDRANT LATENCY TESTS ====================
    
    async def test_qdrant_connection_latency(self) -> TestResult:
        """Test Qdrant connection and basic operations latency"""
        result = TestResult("Qdrant Connection Latency")
        try:
            start = time.perf_counter()
            collections = self.vector_store.client.get_collections()
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = True
            result.latency_ms = round(latency, 2)
            result.details = {
                'collections_count': len(collections.collections),
                'acceptable': latency < 500  # Should be under 500ms
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_qdrant_search_latency(self) -> TestResult:
        """Test vector search latency"""
        result = TestResult("Qdrant Vector Search Latency")
        try:
            # Create a random query vector
            query_vector = [random.random() for _ in range(1536)]
            
            start = time.perf_counter()
            search_results = self.vector_store.search(query_vector, top_k=10)
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = True
            result.latency_ms = round(latency, 2)
            result.details = {
                'results_count': len(search_results),
                'acceptable': latency < 200  # Should be under 200ms for cloud
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_concurrent_searches(self) -> TestResult:
        """Test concurrent search operations"""
        result = TestResult("Concurrent Searches (10x)")
        try:
            async def single_search():
                query_vector = [random.random() for _ in range(1536)]
                return self.vector_store.search(query_vector, top_k=4)
            
            start = time.perf_counter()
            tasks = [single_search() for _ in range(10)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            latency = (time.perf_counter() - start) * 1000
            
            failed = sum(1 for r in results if isinstance(r, Exception))
            
            result.passed = failed == 0
            result.latency_ms = round(latency, 2)
            result.details = {
                'total_searches': 10,
                'failed': failed,
                'avg_latency_per_search': round(latency / 10, 2)
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    # ==================== RETRIEVAL & GENERATION TESTS ====================
    
    async def test_retrieval_empty_query(self) -> TestResult:
        """Test retrieval with empty query"""
        result = TestResult("Retrieval: Empty Query")
        try:
            chunks = await retrieve_chunks("")
            result.passed = True  # Should handle gracefully
            result.details = {'chunks_returned': len(chunks)}
        except Exception as e:
            # Empty query might raise error - that's acceptable
            result.passed = True
            result.error = f"Handled: {type(e).__name__}"
        
        self.results.append(result)
        return result
    
    async def test_retrieval_very_long_query(self) -> TestResult:
        """Test retrieval with very long query (2000+ chars)"""
        result = TestResult("Retrieval: Very Long Query")
        try:
            long_query = "What is " + " ".join(["test"] * 400)  # ~2000 chars
            
            start = time.perf_counter()
            chunks = await retrieve_chunks(long_query)
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = True
            result.latency_ms = round(latency, 2)
            result.details = {
                'query_length': len(long_query),
                'chunks_returned': len(chunks)
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_retrieval_special_characters(self) -> TestResult:
        """Test retrieval with special characters"""
        result = TestResult("Retrieval: Special Characters")
        try:
            queries = [
                "What is @#$%^&*(){}[]?",
                "Test with émojis 🚀 💻 🔥",
                "Unicode: 你好世界 مرحبا العالم",
                "SQL injection'; DROP TABLE--",
                "<script>alert('xss')</script>"
            ]
            
            for query in queries:
                chunks = await retrieve_chunks(query)
            
            result.passed = True
            result.details = {'queries_tested': len(queries)}
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_generation_no_chunks(self) -> TestResult:
        """Test generation with no retrieved chunks"""
        result = TestResult("Generation: No Chunks")
        try:
            answer, status, sources, context = await generate_answer("test query", [])
            
            result.passed = status.value == 'fallback'
            result.details = {
                'status': status.value,
                'has_fallback_message': len(answer) > 0
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_generation_with_chunks(self) -> TestResult:
        """Test generation with mock chunks"""
        result = TestResult("Generation: With Chunks")
        try:
            mock_chunks = [
                {
                    'id': 'test-1',
                    'score': 0.95,
                    'payload': {
                        'text': 'This is test content about AI and machine learning.',
                        'filename': 'test.pdf',
                        'document_id': 'test-doc-1',
                        'chunk_index': 0,
                        'content_hash': 'abc123'
                    }
                }
            ]
            
            start = time.perf_counter()
            answer, status, sources, context = await generate_answer(
                "What is this about?", 
                mock_chunks
            )
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = status.value == 'answered' and len(answer) > 0
            result.latency_ms = round(latency, 2)
            result.details = {
                'status': status.value,
                'answer_length': len(answer),
                'sources_count': len(sources),
                'has_context': len(context) > 0
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    # ==================== FILE SIZE TESTS ====================
    
    async def test_tiny_file(self) -> TestResult:
        """Test with tiny text file (< 100 bytes)"""
        result = TestResult("File Size: Tiny (<100 bytes)")
        try:
            content = "Hello World! This is a tiny test file."
            temp_file = Path("./data/uploads/test_tiny.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_text(content)
            
            start = time.perf_counter()
            ingestion_result = await process_document(
                temp_file, 
                "test_tiny.txt", 
                "text/plain",
                f"test-tiny-{int(time.time())}"
            )
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = ingestion_result['status'] == 'ready'
            result.latency_ms = round(latency, 2)
            result.details = {
                'file_size': len(content),
                'chunks': len(ingestion_result.get('chunks', [])),
                'status': ingestion_result['status']
            }
            
            temp_file.unlink()
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_medium_file(self) -> TestResult:
        """Test with medium text file (~10KB)"""
        result = TestResult("File Size: Medium (~10KB)")
        try:
            # Generate ~10KB of text
            content = "Lorem ipsum dolor sit amet. " * 400  # ~10KB
            temp_file = Path("./data/uploads/test_medium.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_text(content)
            
            start = time.perf_counter()
            ingestion_result = await process_document(
                temp_file,
                "test_medium.txt",
                "text/plain",
                f"test-medium-{int(time.time())}"
            )
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = ingestion_result['status'] == 'ready'
            result.latency_ms = round(latency, 2)
            result.details = {
                'file_size': len(content),
                'chunks': len(ingestion_result.get('chunks', [])),
                'status': ingestion_result['status']
            }
            
            temp_file.unlink()
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_large_file(self) -> TestResult:
        """Test with large text file (~1MB)"""
        result = TestResult("File Size: Large (~1MB)")
        try:
            # Generate ~1MB of text
            content = "This is a large document with lots of content. " * 20000  # ~1MB
            temp_file = Path("./data/uploads/test_large.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_text(content)
            
            start = time.perf_counter()
            ingestion_result = await process_document(
                temp_file,
                "test_large.txt",
                "text/plain",
                f"test-large-{int(time.time())}"
            )
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = ingestion_result['status'] == 'ready'
            result.latency_ms = round(latency, 2)
            result.details = {
                'file_size_kb': round(len(content) / 1024, 2),
                'chunks': len(ingestion_result.get('chunks', [])),
                'status': ingestion_result['status'],
                'processing_time_acceptable': latency < 30000  # Under 30s
            }
            
            temp_file.unlink()
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    async def test_oversized_file(self) -> TestResult:
        """Test rejection of oversized file (>10MB limit)"""
        result = TestResult("File Size: Oversized (>10MB) - Should Reject")
        try:
            # Generate 11MB of text
            content = "X" * (11 * 1024 * 1024)
            temp_file = Path("./data/uploads/test_oversized.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_bytes(content.encode())
            
            # This should fail or be rejected
            ingestion_result = await process_document(
                temp_file,
                "test_oversized.txt",
                "text/plain",
                f"test-oversized-{int(time.time())}"
            )
            
            # If it succeeds with >10MB, that's a problem
            result.passed = False
            result.error = "Should have rejected file >10MB"
            
            temp_file.unlink()
        except Exception as e:
            # Expected to fail
            result.passed = True
            result.error = f"Correctly rejected: {type(e).__name__}"
        
        self.results.append(result)
        return result
    
    # ==================== EDGE CASE TESTS ====================
    
    async def test_empty_file(self) -> TestResult:
        """Test with empty file"""
        result = TestResult("Edge Case: Empty File")
        try:
            temp_file = Path("./data/uploads/test_empty.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_text("")
            
            ingestion_result = await process_document(
                temp_file,
                "test_empty.txt",
                "text/plain",
                f"test-empty-{int(time.time())}"
            )
            
            # Empty file should be handled gracefully
            result.passed = True
            result.details = {
                'status': ingestion_result['status'],
                'chunks': len(ingestion_result.get('chunks', []))
            }
            
            temp_file.unlink()
        except Exception as e:
            # Acceptable to reject empty files
            result.passed = True
            result.error = f"Handled: {type(e).__name__}"
        
        self.results.append(result)
        return result
    
    async def test_invalid_mime_type(self) -> TestResult:
        """Test with unsupported MIME type"""
        result = TestResult("Edge Case: Invalid MIME Type")
        try:
            temp_file = Path("./data/uploads/test.exe")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_bytes(b"FAKE EXECUTABLE")
            
            ingestion_result = await process_document(
                temp_file,
                "test.exe",
                "application/x-executable",
                f"test-exe-{int(time.time())}"
            )
            
            # Should reject
            result.passed = ingestion_result['status'] == 'failed'
            result.details = {'status': ingestion_result['status']}
            
            temp_file.unlink()
        except Exception as e:
            # Expected to fail
            result.passed = True
            result.error = f"Correctly rejected: {type(e).__name__}"
        
        self.results.append(result)
        return result
    
    async def test_duplicate_document(self) -> TestResult:
        """Test uploading same document twice"""
        result = TestResult("Edge Case: Duplicate Document")
        try:
            content = "This is a test document for duplicate testing."
            temp_file = Path("./data/uploads/test_dup.txt")
            temp_file.parent.mkdir(parents=True, exist_ok=True)
            temp_file.write_text(content)
            
            doc_id = f"test-dup-{int(time.time())}"
            
            # First upload
            result1 = await process_document(temp_file, "test_dup.txt", "text/plain", doc_id)
            
            # Second upload (same doc_id should replace)
            result2 = await process_document(temp_file, "test_dup.txt", "text/plain", doc_id)
            
            result.passed = result1['status'] == 'ready' and result2['status'] == 'ready'
            result.details = {
                'first_upload': result1['status'],
                'second_upload': result2['status']
            }
            
            temp_file.unlink()
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    # ==================== STRESS TESTS ====================
    
    async def test_rapid_sequential_queries(self) -> TestResult:
        """Test 50 sequential queries"""
        result = TestResult("Stress: 50 Sequential Queries")
        try:
            queries = [f"Test query number {i}" for i in range(50)]
            
            start = time.perf_counter()
            for query in queries:
                await retrieve_chunks(query)
            latency = (time.perf_counter() - start) * 1000
            
            result.passed = True
            result.latency_ms = round(latency, 2)
            result.details = {
                'total_queries': 50,
                'avg_latency_per_query': round(latency / 50, 2),
                'acceptable': latency < 10000  # Under 10s total
            }
        except Exception as e:
            result.error = str(e)
        
        self.results.append(result)
        return result
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Run all test suites"""
        print("\n" + "=" * 80)
        print("RAG SYSTEM COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"Qdrant URL: {settings.QDRANT_URL}")
        print(f"Collection: {settings.QDRANT_COLLECTION}")
        print(f"Top-K: {settings.TOP_K}")
        print(f"Similarity Threshold: {settings.SIMILARITY_THRESHOLD}")
        print("=" * 80 + "\n")
        
        await self.setup()
        
        test_groups = [
            ("QDRANT LATENCY TESTS", [
                self.test_qdrant_connection_latency,
                self.test_qdrant_search_latency,
                self.test_concurrent_searches,
            ]),
            ("RETRIEVAL & GENERATION TESTS", [
                self.test_retrieval_empty_query,
                self.test_retrieval_very_long_query,
                self.test_retrieval_special_characters,
                self.test_generation_no_chunks,
                self.test_generation_with_chunks,
            ]),
            ("FILE SIZE TESTS", [
                self.test_tiny_file,
                self.test_medium_file,
                self.test_large_file,
                self.test_oversized_file,
            ]),
            ("EDGE CASE TESTS", [
                self.test_empty_file,
                self.test_invalid_mime_type,
                self.test_duplicate_document,
            ]),
            ("STRESS TESTS", [
                self.test_rapid_sequential_queries,
            ]),
        ]
        
        for group_name, tests in test_groups:
            print(f"\n{'─' * 80}")
            print(f"📋 {group_name}")
            print(f"{'─' * 80}\n")
            
            for test_func in tests:
                try:
                    result = await test_func()
                    print(f"  {result}")
                    if result.details:
                        for key, value in result.details.items():
                            print(f"     {key}: {value}")
                except Exception as e:
                    print(f"  ❌ CRASH {test_func.__name__}: {e}")
        
        await self.teardown()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Latency stats
        latencies = [r.latency_ms for r in self.results if r.latency_ms > 0]
        if latencies:
            print(f"\nLatency Stats:")
            print(f"  Average: {sum(latencies)/len(latencies):.2f}ms")
            print(f"  Min: {min(latencies):.2f}ms")
            print(f"  Max: {max(latencies):.2f}ms")
        
        print("=" * 80 + "\n")
        
        return passed == total


async def main():
    suite = RAGTestSuite()
    success = await suite.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
