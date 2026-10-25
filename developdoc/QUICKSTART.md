# RAG Application - Quick Start Guide

## ⚡ TL;DR - Start in 30 Seconds

```powershell
# From the rag_asssignment directory:
.\start_all.bat
```

That's it! Services start automatically and browser opens to http://localhost:3000

---

## 🎯 What This Does

**Upload documents → Ask questions → Get grounded answers with sources**

- Supports: PDF, DOCX, Markdown, TXT
- Powered by: OpenAI embeddings + GPT-4o-mini via OpenRouter
- Vector DB: Qdrant (in-memory, no Docker needed)

---

## 📋 First Time Setup (One-Time Only)

If you just cloned the repo, dependencies are already installed. Just run:

```powershell
.\start_all.bat
```

The batch file handles everything!

---

## 🚀 Using the Application

### 1. Upload a Document
- Click "Upload Document" button
- Or drag & drop a file
- Wait for "Ready" status

### 2. Ask Questions
- Type your question in the chat box
- Or click a suggested question
- Get answer with source citations

### 3. Verify Sources
- Click on source citations
- See document name, page/section, and excerpt
- Confirm answer is grounded in your documents

### 4. Test Fallback
Ask something unrelated to your documents (e.g., "What's the weather?")
→ Should get: "I couldn't find enough information in the uploaded documents..."

---

## 🧪 Run Tests

```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
```

Expected: **43 passed** ✅

---

## 🔧 Manual Start (If Needed)

### Terminal 1: Python AI
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Node Backend
```powershell
cd backend-node
npm run dev
```

### Terminal 3: Frontend
```powershell
cd frontend
npm run dev
```

### Open Browser
http://localhost:3000

---

## 🛑 Stop Services

```powershell
.\stop_all.bat
```

Or press `Ctrl+C` in each terminal if started manually.

---

## 📁 Try These Sample Documents

Included in the repo:
- `quantum_computing_handbook.md` - Markdown with sections
- `Mahi_Patel_Resume.pdf` - PDF resume

Questions to try:
- "What are qubits?"
- "What is the professional experience?"
- "How do I request annual leave?" (if you upload a policy doc)

---

## 🐛 Troubleshooting

### Services won't start
```powershell
.\stop_all.bat
.\start_all.bat
```

### "Cannot connect to AI service"
Ensure Python service is running:
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Port already in use
```powershell
.\stop_all.bat
```

### Tests fail
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest tests/ -v
```

---

## 📚 More Documentation

- **README.md** - Complete documentation
- **STATUS.md** - Current project status
- **SETUP_AND_FIXES.md** - What was fixed
- **docs/** - Architecture, PRD, testing strategy

---

## ✅ Quick Verification

After starting services, check:

1. ✅ Python service: http://127.0.0.1:8000/health
2. ✅ Node backend: http://127.0.0.1:4000/api/health  
3. ✅ Frontend: http://localhost:3000

All should respond (browser or curl).

---

## 🎯 Key Features

✅ Multi-format documents (PDF, DOCX, MD, TXT)  
✅ Smart chunking with overlap (preserves context)  
✅ Semantic search (finds relevant content)  
✅ Grounded answers (no hallucinations)  
✅ Source citations (document + page/section + excerpt)  
✅ Fallback handling (honest "I don't know")  
✅ Dynamic suggestions (per document)  
✅ 43 passing tests  

---

## 🚀 You're Ready!

Just run `.\start_all.bat` and you're good to go! 🎉
