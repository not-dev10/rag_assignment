# 🚀 DocuMind RAG - Complete Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Starting the System](#starting-the-system)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Download | Purpose |
|----------|---------|----------|---------|
| **Python** | 3.11+ | [python.org](https://www.python.org/) | AI service backend |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org/) | Backend API & Frontend |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | Clone repository |

### Required Accounts (Choose One Set)

#### Option A: Free Tier (Recommended for Demo)
- ✅ **OpenRouter Account** ([openrouter.ai](https://openrouter.ai/)) - Free tier available
- ✅ **Qdrant Cloud Account** ([cloud.qdrant.io](https://cloud.qdrant.io/)) - Free tier available

#### Option B: Paid Tier (Production)
- ✅ **OpenAI Account** ([platform.openai.com](https://platform.openai.com/)) - Requires credits
- ✅ **Qdrant Cloud** OR **Docker Desktop** for local Qdrant

---

## Initial Setup

### Step 1: Clone Repository

```powershell
git clone <repository-url>
cd rag_asssignment
```

### Step 2: Python AI Service

```powershell
cd python-ai

# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Verify activation (should show (venv) in prompt)
# If you see "(venv)" or "(.venv)", you're good!

# Install dependencies
pip install -r requirements.txt

# This may take 2-3 minutes
# You should see: Successfully installed <packages>
```

**Troubleshooting Virtual Environment:**

If activation fails:
```powershell
# Enable scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Try activating again
.\.venv\Scripts\Activate.ps1
```

### Step 3: Node Backend

```powershell
cd ../backend-node

# Install dependencies
npm install

# This may take 1-2 minutes
# You should see: added <number> packages
```

### Step 4: Frontend

```powershell
cd ../frontend

# Install dependencies
npm install

# This may take 2-3 minutes
# You should see: added <number> packages
```

---

## Configuration

### Python AI Service Configuration

```powershell
cd python-ai

# Copy template
copy .env.example .env

# Open in editor
notepad .env
```

**Required Configuration:**

```env
# ============ LLM PROVIDER (CHOOSE ONE) ============

# Option A: OpenRouter (Free Tier - Recommended for Demo)
LLM_PROVIDER=openrouter
LLM_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Option B: OpenAI (Paid - Better Performance)
# LLM_PROVIDER=openai
# LLM_MODEL=gpt-4o-mini
# OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# ============ EMBEDDINGS ============
EMBEDDING_MODEL=text-embedding-3-small

# ============ QDRANT (CHOOSE ONE) ============

# Option A: Qdrant Cloud (Recommended)
QDRANT_URL=https://YOUR-CLUSTER.cloud.qdrant.io
QDRANT_API_KEY=YOUR_QDRANT_API_KEY

# Option B: Local Docker
# QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=

# ============ COLLECTION ============
QDRANT_COLLECTION=knowledge_chunks

# ============ SETTINGS (Can Keep Defaults) ============
CHUNK_SIZE=800
CHUNK_OVERLAP=120
TOP_K=4
SIMILARITY_THRESHOLD=0.3
MAX_UPLOAD_MB=10
UPLOAD_DIR=./data/uploads
LOG_LEVEL=INFO
```

**How to Get API Keys:**

1. **OpenRouter API Key**
   - Go to [openrouter.ai](https://openrouter.ai/)
   - Sign up / Log in
   - Click "Keys" in dashboard
   - Create new key
   - Copy key (starts with `sk-or-v1-`)

2. **Qdrant Cloud Cluster**
   - Go to [cloud.qdrant.io](https://cloud.qdrant.io/)
   - Sign up / Log in
   - Click "Create Cluster"
   - Choose free tier
   - Note cluster URL (e.g., `https://xxx.cloud.qdrant.io`)
   - Click "API Keys" → Create → Copy key

### Node Backend Configuration

```powershell
cd ../backend-node

# Copy template
copy .env.example .env

# Open in editor
notepad .env
```

**Configuration:**

```env
PORT=4000
PYTHON_AI_BASE_URL=http://127.0.0.1:8000
REQUEST_TIMEOUT_MS=30000
MAX_UPLOAD_MB=10
```

**No changes needed** - defaults are correct for local development!

### Frontend Configuration

```powershell
cd ../frontend

# Copy template
copy .env.example .env.local

# Open in editor
notepad .env.local
```

**Configuration:**

```env
NEXT_PUBLIC_NODE_API_URL=http://127.0.0.1:4000
```

**No changes needed** - defaults are correct!

---

## Starting the System

### Option A: Automated Launcher (Recommended)

From the repository root:

```powershell
.\start_all.bat
```

This will:
1. ✅ Check if virtual environment exists
2. ✅ Check if .env is configured
3. ✅ Start Python AI service (port 8000)
4. ✅ Start Node backend (port 4000)
5. ✅ Start Frontend (port 3000)
6. ✅ Wait for services to initialize
7. ✅ Check health status
8. ✅ Open browser to http://localhost:3000
9. ✅ Provide interactive menu

**What You'll See:**

```
================================================================================
         DocuMind RAG - Intelligent Document Q&A System                        
                   Service Orchestrator v1.0                                   
================================================================================

 This launcher will start all required services:
   [1/3] Python AI Service    - Port 8000 (FastAPI)
   [2/3] Node.js Backend API  - Port 4000 (Express)
   [3/3] Frontend Web UI      - Port 3000 (Next.js)

================================================================================

[1/3] Launching Python AI Service (Port 8000)...
[2/3] Launching Node.js Backend API (Port 4000)...
[3/3] Launching Frontend Web UI (Port 3000)...

 Waiting for services to initialize...

 [████████████████████] All services launched!

 Opening DocuMind in your default browser...

================================================================================
                     All Systems Operational!                                  
================================================================================

 Frontend UI:    http://localhost:3000
 Backend API:    http://localhost:4000
 Python AI:      http://localhost:8000
```

### Option B: Manual Start (3 Terminals)

**Terminal 1: Python AI**
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: Node Backend**
```powershell
cd backend-node
npm run dev
```

**Terminal 3: Frontend**
```powershell
cd frontend
npm run dev
```

---

## Verification

### Step 1: Check Services

Visit these URLs in your browser:

1. **Python AI Health**: http://localhost:8000/health
   - Should show: `{"status":"ok"}`

2. **Node Backend Health**: http://localhost:4000/api/health
   - Should show: `{"status":"ok", "pythonAi":"connected"}`

3. **Frontend**: http://localhost:3000
   - Should load the DocuMind UI

### Step 2: Upload Test Document

1. Go to **Documents** tab
2. Click **Upload Document** or drag-and-drop a file
3. Wait for status to change to "indexed" (~2-3 seconds)
4. Should see chunk count (e.g., "42 chunks")

**Test Files:**

You can use any of these:
- PDF files
- Word documents (.docx)
- Markdown files (.md)
- Text files (.txt)

Or create a simple test file:

```powershell
echo "This is a test document about AI. Machine learning is a subset of artificial intelligence." > test.txt
```

### Step 3: Ask a Question

1. Go to **Chat** tab
2. Click a suggested question OR type your own
3. Wait 3-5 seconds (free tier latency)
4. Verify:
   - ✅ Answer is displayed
   - ✅ Source citations shown
   - ✅ Can click citations to see excerpts

### Step 4: Test Retrieval Inspector

1. Go to **Retrieval Inspector** tab
2. Enter a query related to your document
3. Click **Inspect Retrieval**
4. Verify:
   - ✅ Retrieved chunks displayed (left panel)
   - ✅ Raw context shown (right panel)
   - ✅ Similarity scores visible

---

## Troubleshooting

### Services Won't Start

**Issue: "Python not found"**
```powershell
# Check Python installation
python --version

# Should show: Python 3.11.x or higher
# If not, download from python.org
```

**Issue: "npm not found"**
```powershell
# Check Node.js installation
node --version
npm --version

# Should show: v20.x.x or higher
# If not, download from nodejs.org
```

**Issue: "Virtual environment activation failed"**
```powershell
# Enable PowerShell scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Recreate virtual environment
cd python-ai
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Configuration Issues

**Issue: "No API key provided"**

Check python-ai/.env file:
```powershell
cd python-ai
notepad .env
```

Verify you have ONE of:
- `OPENROUTER_API_KEY=sk-or-v1-...` (starts with sk-or-v1-)
- `OPENAI_API_KEY=sk-proj-...` (starts with sk-proj-)

**Issue: "Qdrant connection failed"**

If using **Cloud**:
- Verify URL format: `https://your-cluster.cloud.qdrant.io`
- Check API key is correct
- Test connection: `curl https://your-cluster.cloud.qdrant.io/collections`

If using **Local Docker**:
```powershell
# Check if Docker is running
docker ps

# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Verify: http://localhost:6333/dashboard
```

### Runtime Issues

**Issue: Query returns "Insufficient Evidence"**

Possible causes:
1. Document not fully indexed - check status in Documents tab
2. Question not related to document content
3. Similarity threshold too high

**Fix:**
```env
# Lower threshold in python-ai/.env
SIMILARITY_THRESHOLD=0.2
```

Then restart Python service.

**Issue: Services running but UI not loading**

Check browser console (F12):
- Look for CORS errors
- Check network tab for failed requests
- Verify .env.local has: `NEXT_PUBLIC_NODE_API_URL=http://127.0.0.1:4000`

**Issue: Slow responses (>10 seconds)**

Expected behavior on free tier:
- Embedding: ~2.5s
- Search: ~200ms
- Generation: ~3.5s
- **Total: 3-6 seconds**

If slower:
- Check internet connection
- Verify API keys are valid
- Check service logs for errors

### Port Conflicts

**Issue: "Port already in use"**

```powershell
# Find process using port
netstat -ano | findstr :8000
netstat -ano | findstr :4000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Or use stop_all.bat
.\stop_all.bat
```

---

## Next Steps

After successful setup:

1. **Read the README**: Full feature documentation
2. **Try the Demo**: Follow DEMO_NOTES.md for presentation
3. **Run Tests**: `python test_performance.py`
4. **Explore API**: Check API endpoints documentation

---

## Quick Reference

### Start Services
```powershell
.\start_all.bat
```

### Stop Services
```powershell
.\stop_all.bat
```

### Check Status
```powershell
python check_status.py
```

### Run Tests
```powershell
cd python-ai
.\.venv\Scripts\Activate.ps1
python test_performance.py
```

### View Logs
- Python AI: Terminal window "DocuMind AI Service"
- Node Backend: Terminal window "DocuMind Backend API"
- Frontend: Terminal window "DocuMind Frontend"

---

## Support

If you encounter issues not covered here:

1. Check logs in terminal windows
2. Review [README.md](./README.md) troubleshooting section
3. Run health check: `python check_status.py`
4. Test individual services manually

---

**Setup Complete! 🎉**

Your DocuMind RAG system should now be fully operational.

Visit http://localhost:3000 to start using the system!
