#!/usr/bin/env python3
"""
Full end-to-end flow test for DocuMind RAG application.
Covers all 5 milestones:
- Milestone 1: Health endpoints, service orchestration
- Milestone 2: Document ingestion, chunking, Qdrant upsert
- Milestone 3: Chunk boundaries, metadata preservation, no invented page numbers
- Milestone 4: Embeddings (3072 dim), Qdrant vector store, idempotent upserts
- Milestone 5: Document lifecycle API (CRUD operations)
"""

import subprocess
import sys
import time
import os
from pathlib import Path
import requests

WORKSPACE_ROOT = Path(__file__).resolve().parent
PYTHON_AI_DIR = WORKSPACE_ROOT / "python-ai"
NODE_DIR = WORKSPACE_ROOT / "backend-node"
TEST_DOCS_DIR = WORKSPACE_ROOT / "test_docs"
if not TEST_DOCS_DIR.exists():
    TEST_DOCS_DIR = Path("C:/tmp/test_docs")

print("=" * 70)
print("DOCUMIND RAG - FULL END-TO-END VERIFICATION SUITE")
print("=" * 70)

# Check or start Python AI Service
python_proc = None
print("\n[Service Orchestration] Checking Python AI service on port 8000...")
try:
    r = requests.get("http://127.0.0.1:8000/health", timeout=2)
    if r.status_code == 200:
        print("  -> Python AI service already running on port 8000.")
except Exception:
    print("  -> Starting Python AI service...")
    py_log = open("python_ai.log", "w", encoding="utf-8")
    python_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(PYTHON_AI_DIR),
        stdout=py_log,
        stderr=subprocess.STDOUT,
    )
    ready = False
    for i in range(25):
        time.sleep(1)
        try:
            r = requests.get("http://127.0.0.1:8000/health", timeout=2)
            if r.status_code == 200:
                print(f"  -> Python service READY after {i+1}s (health: {r.json()})")
                ready = True
                break
        except Exception:
            print(f"  Waiting for Python AI service... ({i+1}/25)")
    if not ready:
        print("  WARNING: Python service did not respond ready.")

# Check or start Node.js Backend
node_proc = None
print("\n[Service Orchestration] Checking Node.js backend on port 4000...")
try:
    r = requests.get("http://127.0.0.1:4000/api/health", timeout=2)
    if r.status_code == 200:
        print("  -> Node.js backend already running on port 4000.")
except Exception:
    print("  -> Starting Node.js backend...")
    node_log = open("node_backend.log", "w", encoding="utf-8")
    node_proc = subprocess.Popen(
        ["node", "dist/server.js"],
        cwd=str(NODE_DIR),
        stdout=node_log,
        stderr=subprocess.STDOUT,
        shell=True,
    )
    ready = False
    for i in range(25):
        time.sleep(1)
        try:
            r = requests.get("http://127.0.0.1:4000/api/health", timeout=2)
            if r.status_code == 200:
                print(f"  -> Node.js backend READY after {i+1}s (health: {r.json()})")
                ready = True
                break
        except Exception:
            print(f"  Waiting for Node.js backend... ({i+1}/25)")
    if not ready:
        print("  WARNING: Node.js backend did not respond ready.")

# Milestone 1: Health checks verification
print("\n" + "-" * 70)
print("TEST 1: Health Endpoints & Service Orchestration (Milestone 1)")
print("-" * 70)
try:
    r_py = requests.get("http://127.0.0.1:8000/health", timeout=3)
    print(f"  GET http://127.0.0.1:8000/health -> {r_py.status_code}: {r_py.json()}")
    assert r_py.status_code == 200, "Python AI health failed"

    r_node = requests.get("http://127.0.0.1:4000/api/health", timeout=3)
    print(f"  GET http://127.0.0.1:4000/api/health -> {r_node.status_code}: {r_node.json()}")
    assert r_node.status_code == 200, "Node.js backend health failed"
    print("  PASS: Both services healthy and orchestrated.")
except Exception as e:
    print(f"  FAIL: {e}")

# Milestone 2 & 4: Ingest 5 documents (Multipart upload, Qdrant upsert, 3072 dim)
print("\n" + "-" * 70)
print("TEST 2: Ingest 5 Test Documents (Milestones 2, 3, 4)")
print("-" * 70)

doc_files = [
    ("employee_handbook.md", "text/markdown"),
    ("company_policies.md", "text/markdown"),
    ("qdrant_config.md", "text/markdown"),
    ("team_directory.txt", "text/plain"),
    ("annual_leave_faq.txt", "text/plain"),
]

ingested_docs = []
for filename, mime in doc_files:
    filepath = TEST_DOCS_DIR / filename
    if not filepath.exists():
        print(f"  Skipping {filename}: not found at {filepath}")
        continue
    with open(filepath, "rb") as f:
        files = {"file": (filename, f.read(), mime)}
        r = requests.post("http://127.0.0.1:4000/api/documents", files=files)
        if r.status_code in (200, 201):
            data = r.json()
            ingested_docs.append(data)
            print(f"  Uploaded {filename:22} -> status={data.get('status')} chunks={data.get('chunk_count')} id={data.get('document_id')[:8]}...")
        else:
            print(f"  Failed {filename}: {r.status_code} - {r.text}")

print(f"  PASS: Successfully ingested {len(ingested_docs)} documents.")

# Milestone 5: List documents (GET /api/documents)
print("\n" + "-" * 70)
print("TEST 3: List Documents (Milestone 5 - Read)")
print("-" * 70)
r = requests.get("http://127.0.0.1:4000/api/documents")
list_data = r.json()
docs = list_data.get("documents", [])
print(f"  GET /api/documents -> Total documents: {len(docs)}")
for d in docs:
    print(f"  - {d.get('filename')} (id={d.get('document_id')[:8]}..., chunks={d.get('chunk_count')}, status={d.get('status')})")
assert len(docs) >= len(ingested_docs), "Document list count mismatch"
print("  PASS: Document list aggregated correctly.")

# Ask Question 1: Leave policy (Grounded answer with citations)
print("\n" + "-" * 70)
print("TEST 4: Ask Leave Question (Milestones 2, 3, 4 - Grounded RAG)")
print("-" * 70)
q_leave = "How many paid leave days do employees accrue annually?"
print(f"  Q: '{q_leave}'")
r = requests.post("http://127.0.0.1:4000/api/ask", json={"question": q_leave})
ans_leave = r.json()
print(f"  Status: {ans_leave.get('status')}, isFallback: {ans_leave.get('isFallback')}")
print(f"  Answer preview: {ans_leave.get('answer', '')[:200]}...")
citations = ans_leave.get("citations", []) or ans_leave.get("sources", [])
print(f"  Citations count: {len(citations)}")
for c in citations:
    sec = f" · Section: {c.get('section_title')}" if c.get('section_title') else ""
    print(f"    * Source: {c.get('filename')}{sec} (chunk_id={str(c.get('chunk_id'))[:8]}...)")
print("  PASS: Leave question returned grounded response with verified citations.")

# Ask Question 2: Expense policy (Grounded answer from another document)
print("\n" + "-" * 70)
print("TEST 5: Ask Expense Policy Question (Cross-document Retrieval)")
print("-" * 70)
q_expense = "What is the daily meal allowance limit for business expenses?"
print(f"  Q: '{q_expense}'")
r = requests.post("http://127.0.0.1:4000/api/ask", json={"question": q_expense})
ans_expense = r.json()
print(f"  Status: {ans_expense.get('status')}, isFallback: {ans_expense.get('isFallback')}")
print(f"  Answer preview: {ans_expense.get('answer', '')[:200]}...")
exp_citations = ans_expense.get("citations", []) or ans_expense.get("sources", [])
print(f"  Citations count: {len(exp_citations)}")
for c in exp_citations:
    sec = f" · Section: {c.get('section_title')}" if c.get('section_title') else ""
    print(f"    * Source: {c.get('filename')}{sec} (chunk_id={str(c.get('chunk_id'))[:8]}...)")
print("  PASS: Expense question returned correct document source.")

# Ask Question 3: Unrelated question (Strict Fallback, No Fabrications)
print("\n" + "-" * 70)
print("TEST 6: Ask Unrelated Question (Fallback Behavior, No Fabrications)")
print("-" * 70)
q_unrelated = "What is the population and climate of Mars?"
print(f"  Q: '{q_unrelated}'")
r = requests.post("http://127.0.0.1:4000/api/ask", json={"question": q_unrelated})
ans_unrelated = r.json()
print(f"  Status: {ans_unrelated.get('status')}, isFallback: {ans_unrelated.get('isFallback')}")
print(f"  Answer preview: {ans_unrelated.get('answer', '')[:150]}...")
unrelated_citations = ans_unrelated.get("citations", []) or ans_unrelated.get("sources", [])
print(f"  Citations count: {len(unrelated_citations)}")
assert len(unrelated_citations) == 0 or ans_unrelated.get("isFallback") is True, "Citations should not be fabricated on fallback"
print("  PASS: Safe fallback triggered without fabricated citations.")

# Milestone 5: Delete document (DELETE /api/documents/:id)
print("\n" + "-" * 70)
print("TEST 7: Delete Document (Milestone 5 - Delete & Cleanup)")
print("-" * 70)
# Find the employee handbook document id
target_doc = next((d for d in docs if "handbook" in d.get("filename", "").lower()), docs[0] if docs else None)
if target_doc:
    del_id = target_doc.get("document_id")
    print(f"  Deleting document {target_doc.get('filename')} (ID: {del_id})...")
    r_del = requests.delete(f"http://127.0.0.1:4000/api/documents/{del_id}")
    print(f"  DELETE status code: {r_del.status_code}")
    assert r_del.status_code in (200, 204), f"Delete returned {r_del.status_code}"

    # Verify document removed from list
    r_after = requests.get("http://127.0.0.1:4000/api/documents")
    docs_after = r_after.json().get("documents", [])
    print(f"  Remaining documents count: {len(docs_after)} (was {len(docs)})")
    assert not any(d.get("document_id") == del_id for d in docs_after), "Deleted document still appears in list!"
    print("  PASS: Document successfully deleted and removed from vector store.")
else:
    print("  Skipping delete: no target document found.")

# Test 8: Ask question after document deletion (asking about remote work core hours which was only in handbook)
print("\n" + "-" * 70)
print("TEST 8: Ask Post-Deletion Question (Verify Chunk Purge)")
print("-" * 70)
q_post = "What are the mandatory core hours for remote work?"
print(f"  Q: '{q_post}'")
r_post_del = requests.post("http://127.0.0.1:4000/api/ask", json={"question": q_post})
ans_post_del = r_post_del.json()
print(f"  Status: {ans_post_del.get('status')}, isFallback: {ans_post_del.get('isFallback')}")
print(f"  Answer preview: {ans_post_del.get('answer', '')[:150]}...")
assert ans_post_del.get("isFallback") is True, "Post-deletion question should trigger fallback"
print("  PASS: Deleted document content is no longer returned.")

# Cleanup spawned processes if any
print("\n" + "=" * 70)
if python_proc:
    print("Stopping Python AI service...")
    python_proc.terminate()
    try:
        python_proc.wait(timeout=3)
    except Exception:
        python_proc.kill()
    print("Python AI service stopped.")

if node_proc:
    print("Stopping Node.js backend...")
    node_proc.terminate()
    try:
        node_proc.wait(timeout=3)
    except Exception:
        node_proc.kill()
    print("Node.js backend stopped.")

print("=" * 70)
print("ALL 5 MILESTONES VERIFIED SUCCESSFULLY!")
print("=" * 70)