import hashlib
import uuid
from pathlib import Path
from typing import Optional, List
import pypdf
from markdown_it import MarkdownIt
import tiktoken

from app.config import settings


class IngestionError(Exception):
    pass


def compute_content_hash(content: bytes) -> str:
    """Compute SHA-256 hash of raw file content for duplicate detection."""
    return hashlib.sha256(content).hexdigest()


def extract_text_from_pdf(file_path: Path) -> List[dict]:
    """Extract text from PDF with page numbers where available.

    Returns list of dicts with 'page_number' and 'text' keys.
    Returns empty list if PDF has no extractable text.
    """
    pages = []
    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text and text.strip():
                    pages.append({
                        'page_number': i + 1,
                        'text': text,
                    })
    except Exception as e:
        raise IngestionError(f'Failed to extract text from PDF: {e}')
    return pages


def extract_text_from_markdown(file_path: Path) -> List[dict]:
    """Extract text from Markdown with section titles where available.

    Returns list of dicts with 'section_title' and 'text' keys.
    Returns [{section_title: None, text: content}] if text extractable but no headings.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            raise IngestionError(f'Failed to read Markdown file: {e}')
    except Exception as e:
        raise IngestionError(f'Failed to read Markdown file: {e}')

    if not content.strip():
        return []

    md = MarkdownIt()
    tokens = md.parse(content)

    # Build sections by tracking headings
    sections: List[dict] = []
    current_section_title: Optional[str] = None
    current_section_text: List[str] = []

    def flush_section():
        nonlocal current_section_title, current_section_text
        if current_section_text:
            text = '\n'.join(current_section_text).strip()
            if text:
                sections.append({
                    'section_title': current_section_title,
                    'text': text,
                })
        current_section_title = None
        current_section_text = []

    for token in tokens:
        if token.type == 'heading_open':
            # Flush previous section before starting new one
            flush_section()
            # heading_open is followed by inline content for the title
            # We'll capture it via inline tokens
        elif token.type == 'inline':
            # Capture inline content as potential heading text
            if current_section_title is None:
                # This might be a heading title
                current_section_title = token.content if token.content else ''
            else:
                # Add to existing section text
                current_section_text.append(token.content if token.content else '')
        elif token.type == 'paragraph_open':
            pass
        elif token.type == 'text':
            # Regular text content
            if current_section_title is None:
                # No heading yet, accumulate as text
                if 'text' not in locals():
                    # First time, initialize
                    current_section_text = [token.content if token.content else '']
                else:
                    current_section_text.append(token.content if token.content else '')
        elif token.type == 'heading_close':
            # Just mark the heading as done; content already captured
            pass

    # Flush final section
    flush_section()

    if not sections:
        # No headings found; treat entire content as one section
        return [{'section_title': None, 'text': content.strip()}]

    return sections


def extract_text_from_text(file_path: Path) -> List[dict]:
    """Extract text from plain text file.

    Returns list with one dict containing the full text.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            raise IngestionError(f'Failed to read text file: {e}')
    except Exception as e:
        raise IngestionError(f'Failed to read text file: {e}')

    if not content.strip():
        return []

    return [{'section_title': None, 'text': content.strip()}]


def extract_text_from_docx(file_path: Path) -> List[dict]:
    """Extract text and headings from DOCX file."""
    try:
        import docx
        doc = docx.Document(file_path)
        sections = []
        current_section = None
        current_text = []

        def flush():
            nonlocal current_section, current_text
            if current_text:
                joined = '\n'.join(current_text).strip()
                if joined:
                    sections.append({
                        'section_title': current_section,
                        'text': joined,
                    })
            current_section = None
            current_text = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            if p.style and p.style.name and 'heading' in p.style.name.lower():
                flush()
                current_section = text
            else:
                current_text.append(text)

        flush()
        if not sections:
            full_text = '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
            if full_text.strip():
                return [{'section_title': None, 'text': full_text.strip()}]
            return []
        return sections
    except Exception as e:
        raise IngestionError(f'Failed to extract text from DOCX: {e}')


def extract_text(file_path: Path, mime_type: str) -> List[dict]:
    """Dispatch to appropriate extractor based on MIME type or file extension."""
    docx_types = (
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/docx',
        'application/msword',
    )
    if mime_type == 'application/pdf':
        return extract_text_from_pdf(file_path)
    elif mime_type in ('text/markdown', 'text/x-markdown'):
        return extract_text_from_markdown(file_path)
    elif mime_type == 'text/plain':
        return extract_text_from_text(file_path)
    elif mime_type in docx_types:
        return extract_text_from_docx(file_path)
    else:
        suffix = file_path.suffix.lower()
        if suffix == '.docx':
            return extract_text_from_docx(file_path)
        elif suffix in ('.md', '.markdown'):
            return extract_text_from_markdown(file_path)
        elif suffix == '.txt':
            return extract_text_from_text(file_path)
        elif suffix == '.pdf':
            return extract_text_from_pdf(file_path)
        raise IngestionError(f'Unsupported MIME type: {mime_type}')


def chunk_text(
    text: str,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[str]:
    """Split text into token-bounded chunks at natural text boundaries."""
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = settings.CHUNK_OVERLAP

    encoding = tiktoken.get_encoding('cl100k_base')
    if len(encoding.encode(text)) <= chunk_size:
        return [text] if text.strip() else []

    paragraphs = [part.strip() for part in text.split('\n\n') if part.strip()]
    if not paragraphs:
        return []

    units: List[str] = []
    for paragraph in paragraphs:
        tokens = encoding.encode(paragraph)
        if len(tokens) <= chunk_size:
            units.append(paragraph)
            continue
        sentences = [part.strip() for part in __import__('re').split(r'(?<=[.!?])\s+', paragraph) if part.strip()]
        for sentence in sentences:
            sentence_tokens = encoding.encode(sentence)
            if len(sentence_tokens) <= chunk_size:
                units.append(sentence)
                continue
            for start in range(0, len(sentence_tokens), max(1, chunk_size - chunk_overlap)):
                piece = encoding.decode(sentence_tokens[start:start + chunk_size]).strip()
                if piece:
                    units.append(piece)

    chunks: List[str] = []
    current: List[str] = []
    current_tokens = 0
    overlap_text = ''
    for unit in units:
        unit_tokens = len(encoding.encode(unit))
        if current and current_tokens + unit_tokens > chunk_size:
            chunk = '\n\n'.join(current).strip()
            if chunk:
                chunks.append(chunk)
            overlap_tokens = encoding.encode(chunk)[-chunk_overlap:]
            overlap_text = encoding.decode(overlap_tokens).strip()
            current = [overlap_text] if overlap_text else []
            current_tokens = len(overlap_tokens)
        current.append(unit)
        current_tokens += unit_tokens

    final_chunk = '\n\n'.join(current).strip()
    if final_chunk:
        chunks.append(final_chunk)

    return chunks


def create_chunks(
    document_id: str,
    filename: str,
    content_hash: str,
    extracted_sections: List[dict],
    mime_type: str,
) -> List[dict]:
    """Create chunks from extracted sections with metadata.

    Returns list of dicts with: chunk_id, text, chunk_index, document_id, filename,
    content_hash, document_content_hash, page_number (if available), section_title (if available),
    start_char, end_char (offsets when available).
    """
    all_chunks: List[dict] = []
    chunk_index = 0

    for section in extracted_sections:
        section_title = section.get('section_title')
        page_number = section.get('page_number')
        text = section['text']

        if not text.strip():
            continue

        section_chunks = chunk_text(text)

        for i, chunk in enumerate(section_chunks):
            if not chunk.strip():
                continue

            chunk_id = str(uuid.uuid4())
            chunk_hash_val = hashlib.sha256(chunk.encode()).hexdigest()

            chunk_entry: dict = {
                'chunk_id': chunk_id,
                'text': chunk,
                'chunk_index': chunk_index,
                'document_id': document_id,
                'filename': filename,
                'content_hash': chunk_hash_val,
                'document_content_hash': content_hash,
            }

            # Add metadata available from the section
            if page_number is not None:
                chunk_entry['page_number'] = page_number
            if section_title is not None:
                chunk_entry['section_title'] = section_title

            # Add start/end character offsets relative to original document
            # This is approximate since we've already split text
            # We'll set to None for now; could be computed with more complex tracking
            chunk_entry['start_char'] = None
            chunk_entry['end_char'] = None

            all_chunks.append(chunk_entry)
            chunk_index += 1

    return all_chunks


async def process_document(
    file_path: Path,
    filename: str,
    mime_type: str,
    document_id: str,
) -> dict:
    """Main ingestion pipeline: extract text -> chunk -> return processed result.

    Returns dict with:
    - 'status': 'processing', 'ready', or 'failed'
    - 'document_id': the stable document ID
    - 'filename': original filename
    - 'chunk_count': number of chunks created
    - 'error_message': if failed, safe error reason
    - 'content_hash': hash of original file content
    """
    # Read raw file content
    try:
        content_bytes = file_path.read_bytes()
    except Exception as e:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': f'Failed to read file: {e}',
            'content_hash': '',
        }

    # Compute content hash for duplicate detection
    content_hash = compute_content_hash(content_bytes)

    # Validate file size
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content_bytes) > max_bytes:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': f'File size exceeds maximum of {settings.MAX_UPLOAD_MB}MB',
            'content_hash': content_hash,
        }

    # Validate file is not empty
    if len(content_bytes) == 0:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': 'File is empty',
            'content_hash': content_hash,
        }

    # Extract text using appropriate extractor
    try:
        extracted_sections = extract_text(file_path, mime_type)
    except IngestionError as e:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': str(e),
            'content_hash': content_hash,
        }

    # Check if any extractable text was found
    if not extracted_sections:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': 'No extractable text found in document',
            'content_hash': content_hash,
        }

    # Create chunks from extracted sections
    try:
        chunks = create_chunks(document_id, filename, content_hash, extracted_sections, mime_type)
    except Exception as e:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': f'Failed to create chunks: {e}',
            'content_hash': content_hash,
        }

    # Verify we have chunks
    if not chunks:
        return {
            'status': 'failed',
            'document_id': document_id,
            'filename': filename,
            'chunk_count': 0,
            'error_message': 'No valid chunks created from document',
            'content_hash': content_hash,
        }

    return {
        'status': 'ready',
        'document_id': document_id,
        'filename': filename,
        'chunk_count': len(chunks),
        'error_message': None,
        'content_hash': content_hash,
        'chunks': chunks,  # Included for internal use; not returned to API
    }