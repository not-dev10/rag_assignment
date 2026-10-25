# ⚡ DocuMind RAG - Quick Start (5 Minutes)

## 🎯 Goal
Get DocuMind running in 5 minutes and ask your first question.

---

## ✅ Prerequisites Check

```powershell
# Check Python (need 3.11+)
python --version

# Check Node (need 20+)
node --version

# Check npm
npm --version
```

All showing versions? ✅ **Continue!**  
Missing something? ❌ **Install from [python.org](https://python.org) or [nodejs.org](https://nodejs.org)**

---

## 🚀 5-Minute Setup

### 1. Get API Keys (2 minutes)

**OpenRouter (Free Tier)**
1. Go to [openrouter.ai](https://openrouter.ai/)
2. Sign up → Keys → Create
3. Copy key (starts with `sk-or-v1-`)

**Qdrant Cloud (Free Tier)**
1. Go to [cloud.qdrant.io](https://cloud.qdrant.io/)
2. Sign up → Create Cluster (free tier)
3. Note URL: `https://xxx.cloud.qdrant.io`
4. API Keys → Create → Copy

### 2. Setup Python (1 minute)

```powershell
cd python-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure
copy .env.example .env
notepad .env
```

**Paste your keys in .env:**
```env
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY
QDRANT_URL=https://YOUR-CLUSTER.cloud.qdrant.io
QDRANT_API_KEY=YOUR-QDRANT-KEY
```

Save and close!

### 3. Setup Node + Frontend (1 minute)

```powershell
cd ../backend-node
npm install

cd ../frontend
npm install
```

### 4. Launch Everything (1 minute)

```powershell
cd ..
.\start_all.bat
```

Wait for browser to open → **You're ready!** 🎉

---

## 🧪 Test It

### Upload a Document
1. Click **Documents** tab
2. Drag a PDF/TXT/DOCX file
3. Wait for "indexed" status (2-3 seconds)

### Ask a Question
1. Click **Chat** tab
2. Click a suggested question
3. Wait 3-5 seconds (free tier)
4. See answer with sources! ✅

---

## 🐛 Not Working?

### Python activation failed?
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port already in use?
```powershell
.\stop_all.bat
```
Then try `.\start_all.bat` again.

### "No API key provided"?
Check `python-ai\.env` file exists and has your keys.

### Still stuck?
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

---

## 📚 What's Next?

- **Full Documentation**: [README.md](./README.md)
- **Demo Guide**: [DEMO_NOTES.md](./DEMO_NOTES.md)
- **Architecture**: [docs/architecture.md](./docs/architecture.md)
- **Run Tests**: `python python-ai/test_performance.py`

---

**Time to first question: ~5 minutes** ⏱️

Enjoy DocuMind! 🚀
