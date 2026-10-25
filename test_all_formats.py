import requests

# 1. Create a TXT file
with open('system_env_notes.txt', 'w') as f:
    f.write('Server Configuration:\nDatabase port is 5432.\nRedis replication factor is 3 across availability zones.\n')

files_to_test = [
    ('deep_space_comms.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ('quantum_computing_handbook.md', 'text/markdown'),
    ('Mahi_Patel_Resume.pdf', 'application/pdf'),
    ('system_env_notes.txt', 'text/plain')
]

doc_ids = {}
for fname, mtype in files_to_test:
    with open(fname, 'rb') as f:
        r = requests.post('http://localhost:4000/api/documents', files={'file': (fname, f, mtype)})
        data = r.json()
        doc_ids[fname] = data.get('document_id')
        print(f"Uploaded {fname}: status {r.status_code}, chunks: {data.get('chunk_count')}")

print("\n--- 1. Testing DOCX Q&A (OpenRouter) ---")
q_docx = requests.post('http://localhost:4000/api/ask', json={
    'question': 'What frequencies are utilized for deep space downlinks according to the communications protocol?',
    'document_id': doc_ids['deep_space_comms.docx']
}).json()
print('Answer:', q_docx.get('answer'))
print('Citations:', len(q_docx.get('citations', [])))

print("\n--- 2. Testing TXT Q&A (OpenRouter) ---")
q_txt = requests.post('http://localhost:4000/api/ask', json={
    'question': 'What is the Redis replication factor?',
    'document_id': doc_ids['system_env_notes.txt']
}).json()
print('Answer:', q_txt.get('answer'))
print('Citations:', len(q_txt.get('citations', [])))

print("\n--- 3. Testing Dynamic Suggestions (OpenRouter) on DOCX ---")
sug_docx = requests.get(f"http://localhost:4000/api/documents/{doc_ids['deep_space_comms.docx']}/suggestions").json()
for s in sug_docx.get('suggestions', []):
    print(f" - [{s.get('label')}] {s.get('query')}")

print("\n--- 4. Testing Dynamic Suggestions (OpenRouter) on TXT ---")
sug_txt = requests.get(f"http://localhost:4000/api/documents/{doc_ids['system_env_notes.txt']}/suggestions").json()
for s in sug_txt.get('suggestions', []):
    print(f" - [{s.get('label')}] {s.get('query')}")
