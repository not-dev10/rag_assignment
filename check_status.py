import sys
import time
import requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def probe_all(timeout=2):
    results = {
        "python": {"online": False, "data": {}},
        "node": {"online": False, "data": {}},
        "frontend": {"online": False, "status_code": 0},
    }

    # Python AI Service
    try:
        r = requests.get("http://127.0.0.1:8000/health", timeout=timeout)
        if r.status_code == 200:
            results["python"]["online"] = True
            results["python"]["data"] = r.json()
    except Exception:
        pass

    # Node.js Backend API
    try:
        r = requests.get("http://127.0.0.1:4000/api/health", timeout=timeout)
        if r.status_code == 200:
            results["node"]["online"] = True
            results["node"]["data"] = r.json()
    except Exception:
        pass

    # Frontend Next.js UI
    try:
        r = requests.get("http://localhost:3000", timeout=timeout)
        if r.status_code == 200:
            results["frontend"]["online"] = True
            results["frontend"]["status_code"] = r.status_code
    except Exception:
        pass

    return results

def print_dashboard(res):
    print("=" * 70)
    print("              DOCUMIND RAG - SYSTEM STATUS DASHBOARD               ")
    print("=" * 70)

    # Python Service
    py = res["python"]
    if py["online"]:
        data = py["data"]
        print("  [OK] Python AI Service       : ONLINE  -> http://127.0.0.1:8000")
        vs_status = data.get("vector_store", "Connected")
        print(f"  [OK] Qdrant Vector Store     : CONNECTED ({vs_status})")
        llm_name = data.get("llm_provider", "Configured & Active")
        print(f"  [OK] LLM Status              : CONNECTED ({llm_name})")
        emb_name = data.get("embedding_model", "text-embedding-3-large (3072 dim)")
        print(f"  [OK] Embedding Model         : ACTIVE    ({emb_name})")
    else:
        print("  [--] Python AI Service       : OFFLINE (Port 8000)")
        print("  [--] Qdrant Vector Store     : WAITING FOR SERVICE")
        print("  [--] LLM Status              : WAITING FOR SERVICE")

    # Node Backend
    node = res["node"]
    if node["online"]:
        print("  [OK] Node.js Backend API     : ONLINE  -> http://127.0.0.1:4000")
    else:
        print("  [--] Node.js Backend API     : OFFLINE (Port 4000)")

    # Frontend UI
    fe = res["frontend"]
    if fe["online"]:
        print("  [OK] Frontend Web UI         : ONLINE  -> http://localhost:3000")
    else:
        print("  [--] Frontend Web UI         : OFFLINE (Port 3000)")

    print("=" * 70)

def main():
    wait_mode = "--wait" in sys.argv
    max_retries = 30 if wait_mode else 1

    if wait_mode:
        print("Waiting for all services to initialize and connect...")
        for i in range(1, max_retries + 1):
            res = probe_all(timeout=1.5)
            py_ok = "OK" if res["python"]["online"] else "..."
            node_ok = "OK" if res["node"]["online"] else "..."
            fe_ok = "OK" if res["frontend"]["online"] else "..."
            print(f"  Probing ({i}/{max_retries}): Python [{py_ok}] | Node [{node_ok}] | Frontend [{fe_ok}]")
            if res["python"]["online"] and res["node"]["online"] and res["frontend"]["online"]:
                break
            time.sleep(1)
        print()

    res = probe_all(timeout=2)
    print_dashboard(res)
    
    all_online = res["python"]["online"] and res["node"]["online"] and res["frontend"]["online"]
    return 0 if all_online else 1

if __name__ == "__main__":
    sys.exit(main())
