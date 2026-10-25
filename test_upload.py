"""Quick test to upload Mahi Patel's resume and ask a question."""

import requests
import time
from pathlib import Path

BASE_URL = "http://127.0.0.1:4000"

def test_upload_and_query():
    print("=" * 70)
    print("Testing RAG Application with Mahi Patel Resume")
    print("=" * 70)
    
    # 1. Check health
    print("\n[1/4] Checking API health...")
    try:
        health = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"  ✅ Node backend: {health.status_code}")
        health_data = health.json()
        print(f"  ✅ Python service: {health_data.get('python_service', 'connected')}")
    except Exception as e:
        print(f"  ❌ Health check failed: {e}")
        print("\n⚠️  Make sure services are running:")
        print("     cd python-ai && .venv\\Scripts\\Activate.ps1 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        print("     cd backend-node && npm run dev")
        return
    
    # 2. Upload resume
    print("\n[2/4] Uploading Mahi_Patel_Resume.pdf...")
    resume_path = Path("Mahi_Patel_Resume.pdf")
    
    if not resume_path.exists():
        print(f"  ❌ Resume not found at {resume_path.absolute()}")
        print("  Make sure Mahi_Patel_Resume.pdf is in the current directory")
        return
    
    try:
        with open(resume_path, 'rb') as f:
            files = {'file': ('Mahi_Patel_Resume.pdf', f, 'application/pdf')}
            upload_response = requests.post(
                f"{BASE_URL}/api/documents",
                files=files,
                timeout=30
            )
        
        if upload_response.status_code in [200, 201]:
            upload_data = upload_response.json()
            doc_id = upload_data.get('document_id')
            print(f"  ✅ Upload successful!")
            print(f"     Document ID: {doc_id}")
            print(f"     Filename: {upload_data.get('filename')}")
            print(f"     Status: {upload_data.get('status')}")
            print(f"     Chunks: {upload_data.get('chunk_count')}")
        else:
            print(f"  ❌ Upload failed: {upload_response.status_code}")
            print(f"     {upload_response.text}")
            return
    except Exception as e:
        print(f"  ❌ Upload error: {e}")
        return
    
    # 3. List documents
    print("\n[3/4] Listing all documents...")
    try:
        docs_response = requests.get(f"{BASE_URL}/api/documents", timeout=5)
        docs_data = docs_response.json()
        documents = docs_data.get('documents', [])
        print(f"  ✅ Found {len(documents)} document(s)")
        for doc in documents:
            print(f"     • {doc.get('filename')} - {doc.get('chunk_count')} chunks - {doc.get('status')}")
    except Exception as e:
        print(f"  ❌ List error: {e}")
    
    # 4. Ask questions
    print("\n[4/4] Asking questions about Mahi Patel...")
    
    questions = [
        "What is Mahi Patel's technical experience and skills?",
        "What programming languages does Mahi Patel know?",
        "What education does Mahi Patel have?",
        "What is the weather in Paris?"  # Should get fallback
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n  Question {i}: {question}")
        try:
            ask_response = requests.post(
                f"{BASE_URL}/api/ask",
                json={"question": question},
                timeout=15
            )
            
            if ask_response.status_code == 200:
                ask_data = ask_response.json()
                answer = ask_data.get('answer', '')
                status = ask_data.get('status', '')
                sources = ask_data.get('sources', [])
                
                print(f"  Status: {status}")
                print(f"  Answer: {answer[:200]}{'...' if len(answer) > 200 else ''}")
                print(f"  Sources: {len(sources)}")
                
                if sources:
                    for j, source in enumerate(sources[:2], 1):
                        print(f"    [{j}] {source.get('filename')} - Page {source.get('page_number', 'N/A')}")
                        print(f"        Excerpt: {source.get('excerpt', '')[:100]}...")
            else:
                print(f"  ❌ Query failed: {ask_response.status_code}")
                print(f"     {ask_response.text[:200]}")
        except Exception as e:
            print(f"  ❌ Query error: {e}")
        
        time.sleep(0.5)
    
    print("\n" + "=" * 70)
    print("✅ Test completed!")
    print("=" * 70)

if __name__ == "__main__":
    test_upload_and_query()
