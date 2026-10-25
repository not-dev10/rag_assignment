# Qdrant Configuration

## Index Settings

- Distance metric: Cosine
- Vector dimension: 3072 (compatible with text-embedding-3-large)
- Payload schema: document_id, filename, chunk_index, page_number, section_title, text
- Collection name: knowledge_chunks
- Similarity threshold: 0.75 for retrieval

## Qdrant Cloud Setup

- URL: https://969bdf96-2b04-4173-bb6f-722306834919.eu-west-2-0.aws.cloud.qdrant.io
- API key: P-hcAg4dREeS1F-wyPI5rGcDXl6YX44HErqcxsvetto

## Qdrant Local Setup

- Docker: `docker run -p 6333:6333 qdrant/qdrant`
- Default URL: http://localhost:6333

## Payload Fields

- document_id: UUID of the source document
- filename: Original uploaded filename
- chunk_index: Position within document (0, 1, 2, ...)
- page_number: PDF page number (when applicable)
- section_title: Markdown section heading
- text: Chunk text content
- content_hash: SHA-256 of raw file content for duplicate detection