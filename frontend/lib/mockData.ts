import { ChatMessage, ThreadSession, Citation } from '@/types/chat';
import { DocumentItem } from '@/types/document';
import { KnowledgeCollection, SemanticSearchResult } from '@/types/collection';

export const mockCollections: KnowledgeCollection[] = [
  {
    id: 'col-1',
    name: 'Enterprise Core & Compliance',
    description: 'Default corpus for company-wide executive assistants, standard operating procedures, and global regulatory frameworks.',
    documentCount: 420,
    chunkCount: 14850,
    status: 'synced',
    lastSynced: '12m ago',
    icon: 'policy',
    isPrimary: true,
    embeddingModel: 'text-embedding-3-large',
    storageSizeMb: 184.2,
  },
  {
    id: 'col-2',
    name: 'Engineering & Architecture Specs',
    description: 'Cloud microservices architecture, internal API contracts, RFCs, and Qdrant cluster topology specs.',
    documentCount: 615,
    chunkCount: 22140,
    status: 'synced',
    lastSynced: '1h ago',
    icon: 'terminal',
    isPrimary: false,
    embeddingModel: 'text-embedding-3-large',
    storageSizeMb: 245.8,
  },
  {
    id: 'col-3',
    name: 'HR & Employee Handbooks',
    description: 'Global benefits, leave policies, security clearances, and onboarding documentation for distributed teams.',
    documentCount: 393,
    chunkCount: 11229,
    status: 'synced',
    lastSynced: '3h ago',
    icon: 'badge',
    isPrimary: false,
    embeddingModel: 'text-embedding-3-large',
    storageSizeMb: 98.4,
  },
];

export const mockThreadSessions: ThreadSession[] = [
  {
    id: 'thread-1',
    title: 'EU AI Act High-Risk Requirements',
    sourceCount: 3,
    groundingPercentage: 98,
    lastUpdated: '10m ago',
    pinned: true,
    collectionScope: 'Enterprise Core & Compliance',
  },
  {
    id: 'thread-2',
    title: 'Hybrid vs Dense Vector Benchmarks',
    sourceCount: 5,
    groundingPercentage: 94,
    lastUpdated: 'Yesterday',
    pinned: false,
    collectionScope: 'Engineering & Architecture Specs',
  },
  {
    id: 'thread-3',
    title: 'SOC2 Type II Access Audit Controls',
    sourceCount: 4,
    groundingPercentage: 99,
    lastUpdated: '2 days ago',
    pinned: false,
    collectionScope: 'Enterprise Core & Compliance',
  },
  {
    id: 'thread-4',
    title: 'Annual Leave Policy & Carry-over Limits',
    sourceCount: 2,
    groundingPercentage: 100,
    lastUpdated: '3 days ago',
    pinned: false,
    collectionScope: 'HR & Employee Handbooks',
  },
];

export const mockCitations: Citation[] = [
  {
    id: 'cite-1',
    documentId: 'doc-1',
    filename: 'EU_AI_Act_Final_Draft_2024.pdf',
    chunkIndex: 142,
    pageNumber: 48,
    sectionTitle: 'Article 6: Classification Rules for High-Risk AI Systems',
    similarityScore: 0.94,
    tokenRange: 'Tokens 384–896',
    excerpt: 'High-risk AI systems pursuant to Article 6(2) shall establish, implement, document and maintain a continuous risk management system throughout the entire lifecycle of the AI system. The risk management system shall identify and analyse known and foreseeable risks...',
  },
  {
    id: 'cite-2',
    documentId: 'doc-1',
    filename: 'EU_AI_Act_Final_Draft_2024.pdf',
    chunkIndex: 145,
    pageNumber: 52,
    sectionTitle: 'Article 9: Risk Mitigation & Human Oversight',
    similarityScore: 0.89,
    tokenRange: 'Tokens 120–480',
    excerpt: 'Appropriate human oversight measures shall be designed into high-risk AI systems to enable deployers to prevent or minimise operational risks, override automated outputs, and trigger manual fail-safes when anomalous behavior is detected.',
  },
  {
    id: 'cite-3',
    documentId: 'doc-2',
    filename: 'SOC2_Type_II_Security_Policy.md',
    chunkIndex: 78,
    sectionTitle: 'Section 4.3: Automated Decision Auditing',
    similarityScore: 0.84,
    tokenRange: 'Tokens 210–540',
    excerpt: 'All automated reasoning and inference pipelines processing customer data must maintain immutable trace logs including prompt vectors, retrieval candidate IDs, and generated response hashes for a minimum period of 365 days.',
  },
];

export const mockInitialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What are the mandatory compliance obligations for deploying high-risk AI systems under the latest regulatory framework?',
    timestamp: '10:42 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `Based on the indexed regulatory documents, deployers and providers of high-risk AI systems must adhere to four core statutory obligations:

1. **Continuous Risk Management System**:
Pursuant to Article 6(2), organizations must maintain a documented, iterative risk management process across the complete system lifecycle [Doc 1.1].

2. **Data Governance & Bias Mitigation**:
Training, validation, and testing datasets must satisfy strict quality benchmarks, including transparency audits for statistical bias [Doc 1.1].

3. **Human Oversight & Override Capabilities**:
Systems must incorporate verifiable operational guardrails allowing authorized human supervisors to intercept, override, or halt automated inferences in real-time [Doc 1.2].

4. **Immutable Audit Trails**:
In accordance with internal compliance protocols, all automated reasoning chains, retrieval chunk IDs, and model telemetry must be logged and preserved for audit inspection [Doc 2.1].`,
    timestamp: '10:42 AM',
    groundingStatus: 'strict',
    groundingScore: 0.96,
    tokenCount: 428,
    latencyMs: 342,
    model: 'Claude 3.5 Sonnet + text-embedding-3-large',
    citations: mockCitations,
  },
];

export const mockDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    filename: 'EU_AI_Act_Final_Draft_2024.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4820000,
    chunkCount: 284,
    status: 'indexed',
    uploadedAt: 'Today, 09:15 AM',
    collectionId: 'col-1',
    collectionName: 'Enterprise Core & Compliance',
    author: 'Legal Ops',
  },
  {
    id: 'doc-2',
    filename: 'SOC2_Type_II_Security_Policy.md',
    mimeType: 'text/markdown',
    sizeBytes: 420000,
    chunkCount: 88,
    status: 'indexed',
    uploadedAt: 'Yesterday, 04:30 PM',
    collectionId: 'col-1',
    collectionName: 'Enterprise Core & Compliance',
    author: 'Infosec Team',
  },
  {
    id: 'doc-3',
    filename: 'Qdrant_Vector_Cluster_Topology.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 12500000,
    chunkCount: 612,
    status: 'indexed',
    uploadedAt: 'Oct 18, 2026',
    collectionId: 'col-2',
    collectionName: 'Engineering & Architecture Specs',
    author: 'Platform Lead',
  },
  {
    id: 'doc-4',
    filename: 'Employee_Leave_And_Benefits_2025.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1840000,
    chunkCount: 76,
    status: 'indexed',
    uploadedAt: 'Oct 15, 2026',
    collectionId: 'col-3',
    collectionName: 'HR & Employee Handbooks',
    author: 'People Ops',
  },
  {
    id: 'doc-5',
    filename: 'API_Gateway_Specification_v4.json',
    mimeType: 'application/json',
    sizeBytes: 890000,
    chunkCount: 142,
    status: 'processing',
    uploadedAt: '5m ago',
    collectionId: 'col-2',
    collectionName: 'Engineering & Architecture Specs',
    author: 'API Working Group',
  },
];

export const mockSearchResults: SemanticSearchResult[] = [
  {
    id: 'sr-1',
    documentName: 'EU_AI_Act_Final_Draft_2024.pdf',
    collectionName: 'Enterprise Core & Compliance',
    chunkIndex: 142,
    similarityScore: 0.948,
    pageNumber: 48,
    sectionTitle: 'Article 6: High-Risk Classification Rules',
    tokenCount: 420,
    matchedText: 'High-risk AI systems shall establish, implement, document and maintain a continuous risk management system throughout the entire lifecycle of the AI system.',
  },
  {
    id: 'sr-2',
    documentName: 'EU_AI_Act_Final_Draft_2024.pdf',
    collectionName: 'Enterprise Core & Compliance',
    chunkIndex: 145,
    similarityScore: 0.892,
    pageNumber: 52,
    sectionTitle: 'Article 9: Risk Mitigation & Human Oversight',
    tokenCount: 310,
    matchedText: 'Appropriate human oversight measures shall be designed into high-risk AI systems to enable deployers to prevent or minimise operational risks.',
  },
  {
    id: 'sr-3',
    documentName: 'SOC2_Type_II_Security_Policy.md',
    collectionName: 'Enterprise Core & Compliance',
    chunkIndex: 78,
    similarityScore: 0.841,
    sectionTitle: 'Section 4.3: Automated Decision Auditing',
    tokenCount: 290,
    matchedText: 'All automated reasoning and inference pipelines processing customer data must maintain immutable trace logs including prompt vectors and retrieval candidate IDs.',
  },
];
