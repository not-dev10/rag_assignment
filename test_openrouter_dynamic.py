import requests

# 1. Ingest Resume
with open('Mahi_Patel_Resume.pdf', 'rb') as f:
    r1 = requests.post('http://localhost:4000/api/documents', files={'file': ('Mahi_Patel_Resume.pdf', f, 'application/pdf')}).json()
resume_id = r1['document_id']

# 2. Ingest Quantum
with open('quantum_computing_handbook.md', 'rb') as f:
    r2 = requests.post('http://localhost:4000/api/documents', files={'file': ('quantum_computing_handbook.md', f, 'text/markdown')}).json()
quantum_id = r2['document_id']

print('Ingested documents:')
print(f' - Resume: {resume_id}')
print(f' - Quantum doc: {quantum_id}')

# 3. Test suggestions from OpenRouter
sug_quantum = requests.get(f'http://localhost:4000/api/documents/{quantum_id}/suggestions').json()
print('\n[OpenRouter Dynamic Suggestions for quantum_computing_handbook.md]:')
for s in sug_quantum.get('suggestions', []):
    print(f"  - [{s.get('label')}] {s.get('query')}")

sug_resume = requests.get(f'http://localhost:4000/api/documents/{resume_id}/suggestions').json()
print('\n[OpenRouter Dynamic Suggestions for Mahi_Patel_Resume.pdf]:')
for s in sug_resume.get('suggestions', []):
    print(f"  - [{s.get('label')}] {s.get('query')}")

# 4. Scoped Grounded Q&A
ans_quantum = requests.post('http://localhost:4000/api/ask', json={
    'question': 'What are the T1 and T2 coherence times in the quantum processor?',
    'document_id': quantum_id
}).json()
print('\n[Quantum doc scoped answer]:')
print('  Answer:', ans_quantum.get('answer'))
print('  Citations count:', len(ans_quantum.get('citations', [])))

# 5. Cross-doc strict isolation test
cross_res = requests.post('http://localhost:4000/api/ask', json={
    'question': 'What are the T1 and T2 coherence times in the quantum processor?',
    'document_id': resume_id
}).json()
print('\n[Cross-doc isolation test (Asking quantum question while scoped to Resume)]:')
print('  isFallback:', cross_res.get('isFallback'))
print('  Answer:', cross_res.get('answer'))
