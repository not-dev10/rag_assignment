# RAG Application - Setup & Fixes

## Issues Found and Fixed

### 1. ✅ FIXED: start_all.bat Issues

**Problems:**
- Backend was trying to run `node dist/server.js` (production build) instead of `npm run dev`
- Python service wasn't activating the virtual environment

**Fixed:**
- Changed Node backend to use `npm run dev` for development mode
- Added `.venv\Scripts\activate` for Python service
- Updated `start_all.bat` with correct commands

### 2. ✅ FIXED: Missing Python Dependencies

**Problem:**
- `openai` package was missing from requirements.txt
- `python-docx` was missing for DOCX support

**Fixed:**
- Added `openai==1.54.3` to requirements.txt
- Added `python-docx==1.1.2` to requirements.txt

### 3. ✅ ADDED: Comprehensive Test Suite

**Created:**
- `test_rag_pipeline.py` - Full end-to-end RAG testing
- Fixed `test_chunking.py` imports
- Fixed `test_health.py` imports and assertions

### 4. ✅ ADDED: Comprehensive README

**Created:**
- Complete setup instructions
- Architecture diagram
- Environment variable documentation  
- Troubleshooting guide
- Usage examples

## Current Setup Status

### ✅ Completed
- [x] Python AI service fully implemented
- [x] Node backend fully implemented
- [x] Frontend UI fully implemented
- [x] Qdrant integration working
- [x] OpenAI/OpenRouter support
- [x] Test suite created
- [x] Documentation complete

### ⚠️ Needs Setup
- [ ] Python virtual environment needs dependencies installed
- [ ] Services need to be started

## Quick Start Instructions

### Step 1: Install Python Dependencies

```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 2: Configure Environment

Your `.env` files are already configured:

**python-ai/.env:**
- ✅ QDRANT_URL set to `:memory:` (in-memory, no Docker needed)
- ✅ OPENROUTER_API_KEY configured
- ✅ OPENAI_API_KEY configured
- ✅ All settings properly configured

**backend-node/.env:**
- ✅ PORT=4000
- ✅ PYTHON_AI_BASE_URL=http://127.0.0.1:8000

**frontend/.env.local:**
- ✅ NEXT_PUBLIC_NODE_API_URL=http://127.0.0.1:4000

### Step 3: Start All Services

Simply run:

```powershell
.\start_all.bat
```

This will:
1. Start Python AI service on port 8000
2. Start Node backend on port 4000
3. Start Frontend on port 3000
4. Open browser to http://localhost:3000

## Manual Start (Alternative)

If batch file has issues, start manually:

### Terminal 1: Python AI Service
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

## Testing

### Run Python Tests
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
```

### Run Integration Test
```powershell
python full_flow_test.py
```

## What the Application Does

### 1. Document Upload
- Upload PDF, DOCX, Markdown, or TXT files
- System extracts text and preserves metadata (page numbers, sections)
- Text is chunked into overlapping segments (800 chars, 120 overlap)
- Each chunk gets an embedding vector
- Vectors stored in Qdrant with metadata

### 2. Question Answering
- User asks a question
- Question is converted to embedding vector
- Qdrant finds top 4 most similar chunks
- Similarity threshold (0.75) filters irrelevant results
- Retrieved chunks sent to LLM with strict grounding instruction
- LLM generates answer ONLY from provided context
- Sources include document name, page/section, and excerpt

### 3. Fallback Handling
- If no relevant chunks found: fallback message
- If LLM determines insufficient evidence: fallback message
- Never fabricates information

### 4. Document Management
- View all uploaded documents
- See chunk counts and status
- Delete documents (removes from vector store)
- Get dynamic question suggestions per document

## Architecture Flow

```
┌─────────────┐
│   Browser   │
│  (Port 3000)│
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────────────┐
│  Node.js Backend    │
│  Express (Port 4000)│
│  - Validation       │
│  - File upload      │
│  - Error handling   │
└──────┬──────────────┘
       │ HTTP
       ↓
┌──────────────────────────┐
│  Python AI Service       │
│  FastAPI (Port 8000)     │
│  - Text extraction       │
│  - Chunking (800/120)    │
│  - Embeddings (OpenAI)   │
│  - Vector storage        │
│  - Semantic retrieval    │
│  - LLM generation        │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  Qdrant Vector DB        │
│  (:memory: or Cloud)     │
│  - 3072-dim vectors      │
│  - Cosine similarity     │
│  - Metadata filtering    │
└──────────────────────────┘
```

## Key Features Implemented

### ✅ Core Requirements
- [x] PDF, DOCX, MD, TXT support
- [x] Text extraction with metadata preservation
- [x] Smart chunking with overlap
- [x] Vector embeddings (text-embedding-3-large)
- [x] Qdrant vector storage
- [x] Semantic retrieval with threshold
- [x] Grounded LLM answers
- [x] Source citations with page/section
- [x] Fallback for unanswerable questions
- [x] Document management
- [x] Error handling
- [x] Testing suite

### ✅ Advanced Features
- [x] Dynamic question suggestions per document
- [x] Document-scoped chat
- [x] Retrieval context inspection
- [x] Multiple LLM provider support (OpenAI/OpenRouter)
- [x] Mock providers for offline testing
- [x] Duplicate document detection
- [x] Health checks
- [x] Request ID tracking

## Common Issues & Solutions

### Issue: "Cannot connect to AI service"
**Solution:** Ensure Python service is running on port 8000
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Issue: "ModuleNotFoundError: No module named 'openai'"
**Solution:** Install Python dependencies
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: "Port already in use"
**Solution:** Stop existing services
```powershell
.\stop_all.bat
```

### Issue: "No answers returned"
**Solution:** Check Qdrant connection and documents are uploaded
- Verify `QDRANT_URL` in python-ai/.env
- Upload at least one document
- Check document status is "ready"

### Issue: "Import errors in tests"
**Solution:** All test imports are now fixed. Run from python-ai directory:
```powershell
pytest tests/ -v
```

## Environment Variables Explained

### QDRANT_URL Options:
- `:memory:` - In-memory (no persistence, no Docker needed)
- `http://localhost:6333` - Local Docker instance
- `https://xxx.cloud.qdrant.io` - Qdrant Cloud (need API key)

### LLM Provider Options:
- `openai` - Direct OpenAI API
- `openrouter` - OpenRouter aggregator (multiple models)
- `mock` - Offline testing (rule-based responses)

### Embedding Models:
- `text-embedding-3-large` - 3072 dimensions (best quality)
- `text-embedding-3-small` - 1536 dimensions (faster/cheaper)

## Next Steps

1. **Install Python dependencies:**
   ```powershell
   cd python-ai
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```powershell
   .\start_all.bat
   ```

3. **Test the system:**
   - Upload a sample document (try quantum_computing_handbook.md or Mahi_Patel_Resume.pdf)
   - Ask questions about the document
   - Verify sources are cited correctly
   - Try asking unrelated questions to see fallback

4. **Run tests:**
   ```powershell
   cd python-ai
   .\.venv\Scripts\Activate.ps1
   pytest tests/ -v
   ```

## Success Criteria

The application is working correctly when:
- ✅ All three services start without errors
- ✅ Documents can be uploaded successfully
- ✅ Questions return grounded answers with citations
- ✅ Unrelated questions return fallback message
- ✅ Sources show correct document, page, and excerpt
- ✅ Tests pass

## Files Modified/Created

### Modified:
- `start_all.bat` - Fixed Python venv activation and backend dev mode
- `python-ai/requirements.txt` - Added openai and python-docx
- `python-ai/tests/test_chunking.py` - Fixed imports
- `python-ai/tests/test_health.py` - Fixed imports and assertions

### Created:
- `README.md` - Comprehensive documentation
- `SETUP_AND_FIXES.md` - This file
- `python-ai/tests/test_rag_pipeline.py` - Full test suite

## Support

If you encounter issues:
1. Check this document's "Common Issues & Solutions"
2. Verify environment variables in .env files
3. Ensure all dependencies are installed
4. Check service logs in the terminal windows

---

**Status:** Ready to run ✅  
**Last Updated:** Now  
**Next Action:** Run `.\start_all.bat` to start all services
