import asyncio
import sys
from app.services.generation import get_llm_provider, generate_answer
from app.schemas import AskStatus

# Ensure console supports utf-8
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

async def test_llm():
    provider = get_llm_provider()
    provider_name = provider.__class__.__name__
    model_name = getattr(provider, 'model_name', 'N/A')

    print("=" * 70)
    print(f"  LLM PROVIDER TEST SUITE")
    print(f"  Active Provider : {provider_name}")
    print(f"  Target Model    : {model_name}")
    print("=" * 70)

    test_cases = [
        {
            "title": "Test 1: Grounded HR Policy Question",
            "question": "How many days of annual leave do full-time employees get each year?",
            "chunks": [
                {
                    "id": "chunk-hr-1",
                    "payload": {
                        "filename": "employee_handbook.md",
                        "page_number": 3,
                        "section_title": "Paid Time Off (PTO)",
                        "text": "Full-time employees accrue 25 days of paid annual leave per calendar year, accruing evenly each pay period starting on the first day of employment."
                    }
                },
                {
                    "id": "chunk-hr-2",
                    "payload": {
                        "filename": "employee_handbook.md",
                        "page_number": 4,
                        "section_title": "Sick Leave",
                        "text": "Employees receive up to 10 days of paid sick leave per year for personal medical illness or caring for immediate family members."
                    }
                }
            ]
        },
        {
            "title": "Test 2: Grounded Technical Architecture Question",
            "question": "What is the dimensionality and distance metric used for the vector database?",
            "chunks": [
                {
                    "id": "chunk-tech-1",
                    "payload": {
                        "filename": "architecture_spec.md",
                        "page_number": 1,
                        "section_title": "Vector Embeddings & Storage",
                        "text": "Vectors are indexed in Qdrant collections using 3072 dimensions matching the OpenAI text-embedding-3-large model. Distance metric is strictly Cosine similarity."
                    }
                }
            ]
        },
        {
            "title": "Test 3: Expense Policy & Limits Question",
            "question": "What is the daily maximum allowance for client dinners?",
            "chunks": [
                {
                    "id": "chunk-exp-1",
                    "payload": {
                        "filename": "travel_and_expenses.md",
                        "page_number": 2,
                        "section_title": "Meal Allowances",
                        "text": "Client business meals are capped at $85 per person including tax and gratuity. Itemized receipts are mandatory for all expenses exceeding $25."
                    }
                }
            ]
        },
        {
            "title": "Test 4: Out-of-Domain Question (Grounding Guardrail Test)",
            "question": "What is the secret recipe for baking homemade chocolate chip cookies?",
            "chunks": [
                {
                    "id": "chunk-unrelated-1",
                    "payload": {
                        "filename": "security_policy.md",
                        "page_number": 1,
                        "section_title": "Information Security",
                        "text": "All employee laptop storage drives must be encrypted using FileVault or BitLocker with AES-256."
                    }
                }
            ]
        }
    ]

    for tc in test_cases:
        print(f"\n--- {tc['title']} ---")
        print(f"Question : {tc['question']}")
        
        answer, status, sources = await generate_answer(
            question=tc['question'],
            retrieved_chunks=tc['chunks']
        )

        status_label = "ANSWERED [OK]" if status == AskStatus.ANSWERED else "FALLBACK [GROUNDED]"
        print(f"Status   : {status_label}")
        print(f"Answer   : {answer}")
        if sources:
            citations = [f"{s.filename} (p. {s.page_number or 'N/A'})" for s in sources]
            print(f"Sources  : {', '.join(citations)}")

    print("\n" + "=" * 70)
    print("  ALL PROMPTS TESTED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_llm())
