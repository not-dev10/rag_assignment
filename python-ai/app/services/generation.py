from typing import List, Optional
import logging

from app.config import settings
from app.schemas import Source, AskStatus


GROUNDING_INSTRUCTION = """Answer the question using the supplied retrieved context from uploaded documents. Be helpful and provide information found in the context. If the specific question cannot be answered from the context, explain what information IS available in the documents and suggest related questions that can be answered. Only use the FALLBACK response if the context is completely empty or entirely unrelated to the question. Do not invent facts, quotations, or citations that aren't in the context."""


FALLBACK_MESSAGE = """I don't have any uploaded documents that contain information about this topic. Please upload relevant documents first."""


class GenerationError(Exception):
    pass


class LLMProvider:
    """Base class for LLM providers."""

    def __init__(self):
        self.model_name = settings.LLM_MODEL

    async def generate(self, prompt: str, context: str, question: str) -> str:
        raise NotImplementedError

    async def generate_document_suggestions(self, filename: str, content: str) -> List[dict]:
        raise NotImplementedError


class MockLLMProvider(LLMProvider):
    """Mock provider for testing without API keys."""

    async def generate(self, prompt: str, context: str, question: str) -> str:
        # Only trigger fallback if context is truly empty
        if not context.strip():
            return FALLBACK_MESSAGE

        # Try to provide a helpful answer from context
        # Extract meaningful content lines (not just metadata)
        lines = context.split('\n')
        content_lines = []
        for line in lines:
            line_str = line.strip()
            if line_str and not line_str.startswith('[Chunk') and not line_str.startswith('Source:'):
                content_lines.append(line_str)
        
        if content_lines:
            # Return a grounded response using the first few content lines
            response_text = ' '.join(content_lines[:3])[:400]
            return f"Based on the uploaded documents: {response_text}"

        return FALLBACK_MESSAGE

    async def generate_document_suggestions(self, filename: str, content: str) -> List[dict]:
        """Extract questions dynamically from whatever document content is provided."""
        import re
        suggestions = []
        clean_name = filename.replace('.pdf', '').replace('.md', '').replace('.txt', '').replace('_', ' ').replace('-', ' ').strip()
        category = clean_name[:14]

        # 1. Look for markdown headings or uppercase title lines
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        candidate_headings = []
        for line in lines:
            # Markdown header
            if line.startswith('#'):
                header_text = line.lstrip('#').strip()
                if 3 < len(header_text) < 50:
                    candidate_headings.append(header_text)
            # Section header like ALL CAPS or Title:
            elif re.match(r'^[A-Z0-9\s]{3,35}$', line) and len(line.split()) <= 4:
                candidate_headings.append(line.title())
            elif ':' in line and len(line.split(':')[0]) < 35:
                prefix = line.split(':')[0].strip()
                if len(prefix) > 3 and not prefix.lower().startswith('http'):
                    candidate_headings.append(prefix.title())

        # Deduplicate while preserving order
        seen = set()
        unique_headings = []
        for h in candidate_headings:
            h_clean = h.strip()
            if h_clean.lower() not in seen:
                seen.add(h_clean.lower())
                unique_headings.append(h_clean)

        for h in unique_headings[:3]:
            suggestions.append({
                'label': h[:24],
                'query': f"What does {filename} state regarding {h}?",
                'category': category,
            })

        # 2. If we need more, add high-value overview questions tailored to this document
        if len(suggestions) < 3:
            suggestions.append({
                'label': f"{clean_name} Summary"[:24],
                'query': f"What is the main topic and summary of {filename}?",
                'category': category,
            })
        if len(suggestions) < 3:
            suggestions.append({
                'label': "Key Requirements & Details"[:24],
                'query': f"What key details, facts, or instructions are outlined in {filename}?",
                'category': category,
            })

        return suggestions[:4]


class OpenRouterProvider(LLMProvider):
    """OpenRouter provider for multi-model LLM generation."""

    def __init__(self):
        super().__init__()
        self.api_key = settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY
        model = settings.LLM_MODEL
        if not '/' in model:
            self.model_name = f'openai/{model}'
        else:
            self.model_name = model

    async def generate(self, prompt: str, context: str, question: str) -> str:
        mock_provider = MockLLMProvider()
        # Check if key is valid (not empty, not too short)
        if not self.api_key or len(self.api_key) < 20:
            logging.info("No valid OpenRouter/OpenAI key, using mock generation")
            return await mock_provider.generate(prompt, context, question)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                base_url=settings.OPENROUTER_BASE_URL,
                api_key=self.api_key,
                default_headers={
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'DocuMind RAG',
                },
            )
            response = await client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {'role': 'system', 'content': GROUNDING_INSTRUCTION},
                    {'role': 'user', 'content': f'Context:\n{context}\n\nQuestion: {question}'},
                ],
                temperature=0.2,
            )
            answer = response.choices[0].message.content or ''
            logging.info(f"Generated answer using {self.model_name}")
            return answer.strip()
        except Exception as e:
            logging.warning(f'OpenRouter generation failed ({e}), falling back to mock provider')
            return await mock_provider.generate(prompt, context, question)

    async def generate_document_suggestions(self, filename: str, content: str) -> List[dict]:
        mock_provider = MockLLMProvider()
        if not self.api_key:
            return await mock_provider.generate_document_suggestions(filename, content)

        try:
            import json
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                base_url=settings.OPENROUTER_BASE_URL,
                api_key=self.api_key,
                default_headers={
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'DocuMind RAG',
                },
            )
            system_prompt = (
                "You are an AI document assistant. Given text excerpt from an uploaded document, "
                "generate 3 to 4 concise, diverse, high-value questions that can be directly answered using the provided text. "
                "Return ONLY a valid JSON array of objects with keys 'label' (a short 2-4 word topic label) and 'query' (the full question ending with '?'). "
                "Do NOT wrap in markdown code blocks or add any other text."
            )
            response = await client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': f"Document: {filename}\n\nContent excerpt:\n{content[:2500]}"},
                ],
                temperature=0.3,
            )
            raw = (response.choices[0].message.content or '').strip()
            if '```json' in raw:
                raw = raw.split('```json')[1].split('```')[0].strip()
            elif '```' in raw:
                raw = raw.split('```')[1].split('```')[0].strip()

            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                clean_name = filename.replace('.pdf', '').replace('.md', '').replace('.txt', '').replace('_', ' ')[:14]
                clean_sugs = []
                for item in parsed:
                    if isinstance(item, dict) and 'query' in item:
                        label = item.get('label') or item['query'][:24].title()
                        query = item['query']
                        clean_sugs.append({
                            'label': label[:28],
                            'query': query,
                            'category': clean_name
                        })
                if clean_sugs:
                    return clean_sugs[:4]
        except Exception as e:
            logging.warning(f"OpenRouter generate_document_suggestions failed: {e}")

        return await mock_provider.generate_document_suggestions(filename, content)


class OpenAIProvider(LLMProvider):
    """OpenAI provider using gpt-4o-mini or configured model."""

    def __init__(self):
        super().__init__()
        self.api_key = settings.OPENAI_API_KEY

    async def generate(self, prompt: str, context: str, question: str) -> str:
        mock_provider = MockLLMProvider()
        # Check if key is valid
        if not self.api_key or len(self.api_key) < 20:
            logging.info("No valid OpenAI key, using mock generation")
            return await mock_provider.generate(prompt, context, question)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.chat.completions.create(
                model=self.model_name or "gpt-4o-mini",
                messages=[
                    {"role": "system", "content": GROUNDING_INSTRUCTION},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
                ],
                temperature=0.2,
            )
            answer = response.choices[0].message.content or ""
            logging.info(f"Generated answer using {self.model_name or 'gpt-4o-mini'}")
            return answer.strip()
        except Exception as e:
            logging.warning(f"OpenAI generation failed ({e}), falling back to mock provider")
            return await mock_provider.generate(prompt, context, question)

    async def generate_document_suggestions(self, filename: str, content: str) -> List[dict]:
        mock_provider = MockLLMProvider()
        if not self.api_key or len(self.api_key) < 20:
            return await mock_provider.generate_document_suggestions(filename, content)

        try:
            import json
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            system_prompt = (
                "You are an AI document assistant. Given text excerpt from an uploaded document, "
                "generate 3 to 4 concise, diverse, high-value questions that can be directly answered using the provided text. "
                "Return ONLY a valid JSON array of objects with keys 'label' (a short 2-4 word topic label) and 'query' (the full question ending with '?'). "
                "Do NOT wrap in markdown code blocks or add any other text."
            )
            response = await client.chat.completions.create(
                model=self.model_name or "gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Document: {filename}\n\nContent excerpt:\n{content[:2500]}"}
                ],
                temperature=0.3,
            )
            raw = (response.choices[0].message.content or "").strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                clean_name = filename.replace('.pdf', '').replace('.md', '').replace('.txt', '').replace('_', ' ')[:14]
                clean_sugs = []
                for item in parsed:
                    if isinstance(item, dict) and 'query' in item:
                        label = item.get('label') or item['query'][:24].title()
                        query = item['query']
                        clean_sugs.append({
                            'label': label[:28],
                            'query': query,
                            'category': clean_name
                        })
                if clean_sugs:
                    return clean_sugs[:4]
        except Exception as e:
            logging.warning(f"OpenAI generate_document_suggestions failed: {e}")

        return await mock_provider.generate_document_suggestions(filename, content)


def get_llm_provider() -> LLMProvider:
    """Factory function to get the configured LLM provider."""
    provider_name = settings.LLM_PROVIDER.lower()
    
    # Check for OpenRouter key (starts with sk-or-)
    has_openrouter = (
        settings.OPENROUTER_API_KEY
        and len(settings.OPENROUTER_API_KEY) > 20
    )
    
    # Check for OpenAI key  
    has_openai = (
        settings.OPENAI_API_KEY
        and len(settings.OPENAI_API_KEY) > 20
        and settings.OPENAI_API_KEY.startswith('sk-proj')
    )
    
    is_openrouter = (
        provider_name == 'openrouter'
        or has_openrouter
        or (settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith('sk-or-'))
    )

    if is_openrouter and has_openrouter:
        logging.info(f"Using OpenRouter with model: {settings.LLM_MODEL}")
        return OpenRouterProvider()

    if provider_name == 'openai' and has_openai:
        logging.info(f"Using OpenAI with model: {settings.LLM_MODEL}")
        return OpenAIProvider()

    logging.info("Using Mock LLM Provider (no valid API keys)")
    return MockLLMProvider()


async def generate_answer(
    question: str,
    retrieved_chunks: List[dict],
) -> tuple[str, AskStatus, List[Source], str]:
    """
    Generate an answer from retrieved chunks.
    Returns (answer, status, sources, raw_context).
    """
    if not retrieved_chunks:
        return FALLBACK_MESSAGE, AskStatus.FALLBACK, [], ""

    llm_provider = get_llm_provider()

    # Build context from retrieved chunks
    context_parts = []
    sources = []

    for i, result in enumerate(retrieved_chunks):
        payload = result['payload']
        chunk_id = result['id']

        # Create source citation
        source = Source(
            filename=payload.get('filename', 'unknown'),
            page_number=payload.get('page_number'),
            section_title=payload.get('section_title'),
            chunk_id=chunk_id,
            excerpt=payload.get('text', '')[:300],
        )
        sources.append(source)

        # Build context entry
        source_info = f"Source: {source.filename}"
        if source.page_number:
            source_info += f" (Page {source.page_number})"
        if source.section_title:
            source_info += f" · {source.section_title}"

        context_parts.append(
            f"[Chunk {i+1}] {source_info}\n{payload.get('text', '')}"
        )

    context = '\n\n'.join(context_parts)

    # Build prompt
    prompt = f"""{GROUNDING_INSTRUCTION}

Context:
{context}

Question: {question}

Answer:"""

    try:
        answer = await llm_provider.generate(prompt, context, question)

        # Only trigger fallback if the answer is explicitly the fallback message or empty
        if (
            answer.strip() == FALLBACK_MESSAGE.strip()
            or not answer.strip()
        ):
            return FALLBACK_MESSAGE, AskStatus.FALLBACK, [], context

        # Otherwise, return the answer with sources and context
        return answer, AskStatus.ANSWERED, sources, context

    except Exception as e:
        raise GenerationError(f'LLM generation failed: {e}')