# Advanced Memory and Context Management Architecture

## Executive Summary

This document outlines the architecture for enhancing Council's memory system from basic keyword-based retrieval to semantic understanding with long-term and short-term memory, advanced retrieval algorithms, and intelligent summarization.

**Current State:** Basic keyword-based memory with simple relevance scoring  
**Target State:** Semantic memory with embeddings, hybrid retrieval, and intelligent context management

---

## Table of Contents

1. [Current System Analysis](#current-system-analysis)
2. [Proposed Architecture](#proposed-architecture)
3. [Storage Strategy](#storage-strategy)
4. [Retrieval Algorithms](#retrieval-algorithms)
5. [Implementation Plan](#implementation-plan)
6. [Technology Choices](#technology-choices)
7. [Migration Strategy](#migration-strategy)
8. [Performance Considerations](#performance-considerations)

---

## Current System Analysis

### Existing Components

**Files:**
- `src/features/council/lib/council-memory.ts` - Core memory functions
- `src/features/council/store/memory-store.ts` - Zustand store
- `src/features/council/lib/session-history.ts` - Session management

**Current Features:**
- ✅ Cross-session persistence (IndexedDB via idb-keyval)
- ✅ Memory types: insight, pattern, user_preference, domain_knowledge
- ✅ Basic relevance scoring (keyword overlap + recency)
- ✅ Automatic pruning (max 100 entries)
- ✅ Tag extraction and filtering
- ✅ Session history with localStorage

### Limitations

1. **No Semantic Understanding**
   - Keyword-only matching (literal text overlap)
   - Misses conceptually similar memories
   - No understanding of synonyms or context

2. **Single Memory Type**
   - No distinction between short-term and long-term
   - All memories treated equally
   - No automatic promotion/demotion

3. **Simple Retrieval**
   - Basic keyword overlap scoring
   - No multi-criteria ranking
   - Limited context awareness

4. **No Summarization**
   - Memories stored at full length
   - No compression for old/less-relevant memories
   - Context window not optimized

5. **Basic Pruning**
   - Simple LRU with relevance score
   - No intelligent consolidation
   - Potential information loss

---

## Proposed Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Council Application                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Memory Manager                        │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  • Semantic Encoding                              │  │
│  │  • Memory Storage                                 │  │
│  │  • Retrieval Engine                               │  │
│  │  • Summarization Engine                           │  │
│  │  • Context Builder                                │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Storage Layer                             │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │  Short-Term  │  │  Long-Term   │             │  │
│  │  │   Memory     │  │   Memory     │             │  │
│  │  │  (Session)   │  │ (Persistent) │             │  │
│  │  └──────────────┘  └──────────────┘             │  │
│  │                                                   │  │
│  │  ┌──────────────────────────────────────┐       │  │
│  │  │      IndexedDB                       │       │  │
│  │  │  • Text content                      │       │  │
│  │  │  • Vector embeddings (Float32Array)  │       │  │
│  │  │  • Metadata & tags                   │       │  │
│  │  └──────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Embedding Service                         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  Options:                                         │  │
│  │  • transformers.js (local, privacy-friendly)     │  │
│  │  • OpenAI API (best quality, requires key)       │  │
│  │  • Cohere API (alternative)                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Memory Manager
Central orchestrator for all memory operations.

```typescript
interface MemoryManager {
  // Core operations
  add(entry: MemoryEntry): Promise<void>;
  retrieve(query: string, options?: RetrievalOptions): Promise<MemoryEntry[]>;
  summarize(entries: MemoryEntry[]): Promise<string>;
  
  // Memory lifecycle
  promote(entryId: string): Promise<void>; // Short-term → Long-term
  decay(entryId: string): Promise<void>;   // Reduce relevance
  consolidate(): Promise<void>;            // Merge similar memories
}
```

#### 2. Semantic Encoding
Converts text to vector embeddings for semantic search.

```typescript
interface SemanticEncoder {
  encode(text: string): Promise<Float32Array>;
  batchEncode(texts: string[]): Promise<Float32Array[]>;
  similarity(embedding1: Float32Array, embedding2: Float32Array): number;
}
```

#### 3. Storage Layer
Handles persistence with support for embeddings.

```typescript
interface MemoryStorage {
  // CRUD operations
  save(entry: SemanticMemoryEntry): Promise<void>;
  get(id: string): Promise<SemanticMemoryEntry | null>;
  query(filters: MemoryQuery): Promise<SemanticMemoryEntry[]>;
  delete(id: string): Promise<void>;
  
  // Batch operations
  batchSave(entries: SemanticMemoryEntry[]): Promise<void>;
  batchQuery(filters: MemoryQuery[]): Promise<SemanticMemoryEntry[][]>;
}
```

#### 4. Retrieval Engine
Implements hybrid search with multiple ranking strategies.

```typescript
interface RetrievalEngine {
  // Search methods
  semanticSearch(query: string, topK: number): Promise<MemoryEntry[]>;
  keywordSearch(query: string, topK: number): Promise<MemoryEntry[]>;
  hybridSearch(query: string, options: HybridSearchOptions): Promise<MemoryEntry[]>;
  
  // Scoring
  scoreRelevance(entry: MemoryEntry, query: string): number;
  rankResults(entries: MemoryEntry[], query: string): MemoryEntry[];
}
```

#### 5. Summarization Engine
Compresses memories intelligently to fit context limits.

```typescript
interface SummarizationEngine {
  summarize(text: string, maxTokens: number): Promise<string>;
  batchSummarize(texts: string[], maxTokens: number): Promise<string[]>;
  extractive(text: string, numSentences: number): string;
  abstractive(text: string, maxTokens: number): Promise<string>;
}
```

---

## Storage Strategy

### Enhanced Memory Entry Schema

```typescript
interface SemanticMemoryEntry {
  // Basic fields (existing)
  id: string;
  timestamp: Date;
  sessionId: string;
  type: MemoryType | MemoryTier;
  content: string;
  tags: string[];
  relevanceScore: number;
  
  // New semantic fields
  embedding: Float32Array;          // Vector representation
  embeddingModel: string;           // "text-embedding-ada-002" or "transformers-js-v1"
  tier: 'short-term' | 'long-term'; // Memory classification
  
  // Enhanced metadata
  accessCount: number;              // How many times retrieved
  lastAccessed: Date;               // Last retrieval timestamp
  consolidatedFrom?: string[];      // IDs if merged from multiple memories
  summary?: string;                 // Compressed version for context limits
  tokenCount: number;               // For context window management
  
  // Semantic relationships
  similarityLinks: Array<{          // Related memories
    id: string;
    similarity: number;
  }>;
}
```

### Memory Tier System

**Short-term Memory:**
- Scope: Current session
- Lifetime: Hours to days
- Storage: sessionStorage + IndexedDB
- Purpose: Immediate context, recent interactions
- Promotion: Based on access frequency and relevance

**Long-term Memory:**
- Scope: Cross-session
- Lifetime: Weeks to months
- Storage: IndexedDB
- Purpose: Persistent knowledge, patterns, preferences
- Demotion: Based on staleness and low access

### IndexedDB Schema

```typescript
// Database: "council_memory_v2"
// Version: 2

// Object Store: "memories"
interface MemoryStore {
  key: string;                    // id
  value: SemanticMemoryEntry;
  indexes: {
    sessionId: string;
    type: MemoryType;
    tier: 'short-term' | 'long-term';
    timestamp: Date;
    relevanceScore: number;
    tags: string[];               // Multi-entry index
  };
}

// Object Store: "embeddings"
interface EmbeddingStore {
  key: string;                    // memory id
  value: {
    embedding: Float32Array;
    model: string;
    generatedAt: Date;
  };
}

// Object Store: "sessions"
interface SessionStore {
  key: string;                    // session id
  value: {
    id: string;
    startTime: Date;
    endTime?: Date;
    memoryIds: string[];
  };
}
```

### Storage Size Management

**Targets:**
- Short-term: 50 entries max (~500KB)
- Long-term: 200 entries max (~5MB)
- Embeddings: ~4KB per entry (1536 dims × 4 bytes)

**Pruning Strategy:**
1. Remove expired short-term memories
2. Summarize old long-term memories
3. Consolidate similar memories
4. Archive least-accessed memories

---

## Retrieval Algorithms

### 1. Semantic Search

```typescript
async function semanticSearch(
  query: string,
  topK: number = 10
): Promise<MemoryEntry[]> {
  // 1. Generate query embedding
  const queryEmbedding = await encoder.encode(query);
  
  // 2. Retrieve all memories
  const allMemories = await storage.query({ tier: 'all' });
  
  // 3. Calculate cosine similarity
  const scored = allMemories.map(memory => ({
    memory,
    similarity: cosineSimilarity(queryEmbedding, memory.embedding)
  }));
  
  // 4. Sort by similarity and return top K
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(s => s.memory);
}
```

### 2. Hybrid Search

Combines semantic understanding with keyword matching and recency.

```typescript
async function hybridSearch(
  query: string,
  options: HybridSearchOptions
): Promise<MemoryEntry[]> {
  const {
    topK = 10,
    semanticWeight = 0.6,
    keywordWeight = 0.3,
    recencyWeight = 0.1,
  } = options;
  
  // 1. Generate query embedding
  const queryEmbedding = await encoder.encode(query);
  
  // 2. Extract keywords
  const keywords = extractKeywords(query);
  
  // 3. Retrieve and score all memories
  const allMemories = await storage.query({ tier: 'all' });
  
  const scored = allMemories.map(memory => {
    // Semantic similarity
    const semanticScore = cosineSimilarity(queryEmbedding, memory.embedding);
    
    // Keyword overlap
    const keywordScore = calculateKeywordOverlap(keywords, memory);
    
    // Recency score
    const ageMs = Date.now() - memory.timestamp.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyScore = Math.exp(-ageDays / 30); // Exponential decay
    
    // Weighted combination
    const totalScore =
      semanticScore * semanticWeight +
      keywordScore * keywordWeight +
      recencyScore * recencyWeight;
    
    return { memory, score: totalScore };
  });
  
  // 4. Sort and return top K
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.memory);
}
```

### 3. Context-Aware Retrieval

Considers the current conversation context and expert outputs.

```typescript
async function contextAwareRetrieval(
  query: string,
  context: {
    previousMemories: MemoryEntry[];
    expertOutputs: string[];
    sessionContext: string;
  },
  topK: number = 10
): Promise<MemoryEntry[]> {
  // 1. Build enhanced query from context
  const enhancedQuery = [
    query,
    context.sessionContext,
    ...context.expertOutputs.slice(-3) // Last 3 outputs
  ].join(' ');
  
  // 2. Perform hybrid search
  const candidates = await hybridSearch(enhancedQuery, { topK: topK * 2 });
  
  // 3. Re-rank based on context coherence
  const scored = candidates.map(memory => {
    // Avoid repeating recent memories
    const alreadyUsed = context.previousMemories.some(
      prev => prev.id === memory.id
    );
    const repetitionPenalty = alreadyUsed ? 0.5 : 1.0;
    
    // Boost if similar to current expert outputs
    const contextBoost = calculateContextSimilarity(
      memory,
      context.expertOutputs
    );
    
    return {
      memory,
      score: memory.relevanceScore * repetitionPenalty * (1 + contextBoost)
    };
  });
  
  // 4. Return top K after re-ranking
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.memory);
}
```

### 4. Multi-Stage Retrieval

For complex queries, use multiple passes with refinement.

```typescript
async function multiStageRetrieval(
  query: string,
  maxMemories: number = 10
): Promise<MemoryEntry[]> {
  // Stage 1: Broad retrieval (cast wide net)
  const stage1 = await hybridSearch(query, { topK: maxMemories * 3 });
  
  // Stage 2: Analyze query intent
  const intent = await analyzeQueryIntent(query);
  
  // Stage 3: Filter by intent
  const stage2 = stage1.filter(memory => 
    matchesIntent(memory, intent)
  );
  
  // Stage 4: Diversity selection
  const stage3 = selectDiverseMemories(stage2, maxMemories);
  
  // Stage 5: Final re-ranking
  return rankByImportance(stage3);
}
```

### 5. Similarity-Based Clustering

Group similar memories before retrieval.

```typescript
async function clusterSimilarMemories(): Promise<MemoryCluster[]> {
  const allMemories = await storage.query({ tier: 'long-term' });
  
  // Build similarity matrix
  const similarityMatrix: number[][] = [];
  for (let i = 0; i < allMemories.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < allMemories.length; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 1.0;
      } else {
        similarityMatrix[i][j] = cosineSimilarity(
          allMemories[i].embedding,
          allMemories[j].embedding
        );
      }
    }
  }
  
  // Cluster using hierarchical clustering
  const clusters = hierarchicalClustering(similarityMatrix, threshold = 0.7);
  
  // Create representative memory for each cluster
  return clusters.map(cluster => ({
    id: generateClusterId(),
    members: cluster.map(idx => allMemories[idx]),
    centroid: calculateCentroid(cluster.map(idx => allMemories[idx].embedding)),
    summary: summarizeCluster(cluster.map(idx => allMemories[idx]))
  }));
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up infrastructure for semantic memory

**Tasks:**
1. Update IndexedDB schema
   - Add embedding storage
   - Add tier classification
   - Add metadata fields

2. Integrate embedding service
   - Choose: transformers.js (local) OR OpenAI API
   - Create encoder service wrapper
   - Implement caching for embeddings

3. Update memory entry interface
   - Add semantic fields
   - Maintain backward compatibility
   - Write migration script

**Deliverables:**
- Updated schema
- Embedding service
- Type definitions
- Migration utility

### Phase 2: Semantic Search (Week 3-4)

**Goal:** Implement vector-based retrieval

**Tasks:**
1. Implement cosine similarity
   - Efficient Float32Array operations
   - Batch processing support
   - Performance optimization

2. Create semantic search
   - Query embedding generation
   - Similarity calculation
   - Top-K retrieval

3. Update retrieval functions
   - Replace keyword-only with hybrid
   - Add semantic search option
   - Maintain backward compatibility

**Deliverables:**
- Semantic search function
- Updated retrieval API
- Performance benchmarks

### Phase 3: Memory Tiers (Week 5-6)

**Goal:** Implement short-term and long-term memory

**Tasks:**
1. Create tier management
   - Short-term: session-scoped
   - Long-term: persistent
   - Promotion logic

2. Implement lifecycle
   - Automatic promotion (access frequency)
   - Decay mechanism (staleness)
   - Consolidation (merge similar)

3. Update storage layer
   - Separate stores for tiers
   - Efficient querying
   - Cleanup routines

**Deliverables:**
- Tier management system
- Promotion/demotion logic
- Lifecycle automation

### Phase 4: Advanced Retrieval (Week 7-8)

**Goal:** Enhance retrieval with hybrid and context-aware methods

**Tasks:**
1. Implement hybrid search
   - Combine semantic + keyword
   - Weighted scoring
   - Configurable weights

2. Add context-aware retrieval
   - Consider conversation history
   - Diversity selection
   - Repetition avoidance

3. Multi-stage retrieval
   - Intent analysis
   - Multi-pass refinement
   - Diversity optimization

**Deliverables:**
- Hybrid search
- Context-aware retrieval
- Multi-stage pipeline

### Phase 5: Summarization (Week 9-10)

**Goal:** Implement intelligent memory compression

**Tasks:**
1. Extractive summarization
   - Sentence scoring
   - Top-K selection
   - Coherence optimization

2. Integration with LLM (optional)
   - Abstractive summarization
   - Context-aware compression
   - Summary quality scoring

3. Token-aware context building
   - Calculate token counts
   - Dynamic compression
   - Priority-based inclusion

**Deliverables:**
- Summarization engine
- Token management
- Context builder

### Phase 6: Optimization & Polish (Week 11-12)

**Goal:** Performance optimization and user experience

**Tasks:**
1. Performance optimization
   - Index optimization
   - Batch processing
   - Caching strategies

2. User interface
   - Memory explorer UI
   - Visualization of clusters
   - Manual memory management

3. Analytics & monitoring
   - Retrieval effectiveness metrics
   - Memory usage statistics
   - A/B testing framework

**Deliverables:**
- Optimized performance
- Enhanced UI
- Analytics dashboard

---

## Technology Choices

### Embedding Services

#### Option 1: transformers.js (Recommended)

**Pros:**
- ✅ Client-side (privacy-friendly)
- ✅ No API costs
- ✅ Works offline
- ✅ Fast after initial load
- ✅ Open source

**Cons:**
- ❌ Initial model download (~50MB)
- ❌ Lower quality than OpenAI
- ❌ Requires WebAssembly support

**Models:**
- `Xenova/all-MiniLM-L6-v2` - 384 dimensions, fast
- `Xenova/all-mpnet-base-v2` - 768 dimensions, better quality

**Implementation:**
```typescript
import { pipeline } from '@xenova/transformers';

const encoder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embedding = await encoder('Your text here', { pooling: 'mean', normalize: true });
```

#### Option 2: OpenAI Embeddings API

**Pros:**
- ✅ Highest quality
- ✅ No client-side load
- ✅ 1536 dimensions
- ✅ Well-tested

**Cons:**
- ❌ Requires API key
- ❌ Costs money ($0.0001 per 1K tokens)
- ❌ Privacy concerns
- ❌ Requires internet

**Implementation:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: 'Your text here',
});
const embedding = response.data[0].embedding;
```

#### Option 3: Cohere Embeddings API

**Pros:**
- ✅ Good quality
- ✅ Competitive pricing
- ✅ Multiple languages
- ✅ Batch support

**Cons:**
- ❌ Requires API key
- ❌ Costs money
- ❌ Less well-known

### Vector Storage

#### IndexedDB (Recommended)

**Pros:**
- ✅ Built into browsers
- ✅ Large storage quota
- ✅ Async API
- ✅ Supports binary data (Float32Array)
- ✅ No additional dependencies

**Cons:**
- ❌ Manual indexing
- ❌ No built-in vector search
- ❌ Requires custom similarity calculation

#### Alternative: Pinecone

**Pros:**
- ✅ Purpose-built for vectors
- ✅ Fast similarity search
- ✅ Managed service

**Cons:**
- ❌ Requires API key
- ❌ Costs money
- ❌ Requires internet
- ❌ Privacy concerns

### Recommendation

**For Council:**
Use **transformers.js + IndexedDB** for:
- Privacy (all client-side)
- No API costs
- Offline support
- Good enough quality
- Full control

Consider OpenAI for premium tier or enterprise version.

---

## Migration Strategy

### Phase 1: Parallel Systems

Run old and new memory systems side-by-side.

```typescript
// Memory manager with dual storage
class DualMemoryManager {
  private legacy: LegacyMemoryStore;
  private semantic: SemanticMemoryStore;
  
  async add(entry: MemoryEntry): Promise<void> {
    // Write to both systems
    await this.legacy.add(entry);
    
    try {
      const embedding = await encoder.encode(entry.content);
      await this.semantic.add({ ...entry, embedding });
    } catch (error) {
      console.warn('Semantic storage failed, legacy only', error);
    }
  }
  
  async retrieve(query: string): Promise<MemoryEntry[]> {
    // Try semantic first
    try {
      return await this.semantic.hybridSearch(query);
    } catch (error) {
      // Fallback to legacy
      return await this.legacy.keywordSearch(query);
    }
  }
}
```

### Phase 2: Gradual Migration

Migrate existing memories with embeddings generation.

```typescript
async function migrateExistingMemories(): Promise<void> {
  const legacyMemories = await loadLegacyMemories();
  const batchSize = 10;
  
  for (let i = 0; i < legacyMemories.length; i += batchSize) {
    const batch = legacyMemories.slice(i, i + batchSize);
    
    // Generate embeddings
    const texts = batch.map(m => m.content);
    const embeddings = await encoder.batchEncode(texts);
    
    // Create semantic entries
    const semanticEntries = batch.map((memory, idx) => ({
      ...memory,
      embedding: embeddings[idx],
      embeddingModel: 'transformers-js-v1',
      tier: 'long-term' as const,
      accessCount: 0,
      lastAccessed: new Date(),
      tokenCount: estimateTokenCount(memory.content),
    }));
    
    // Save to new storage
    await semanticStorage.batchSave(semanticEntries);
    
    // Progress indicator
    console.log(`Migrated ${Math.min(i + batchSize, legacyMemories.length)} / ${legacyMemories.length}`);
  }
}
```

### Phase 3: Switch Over

Once migration is complete and tested, switch to semantic-only.

```typescript
// Feature flag for gradual rollout
const USE_SEMANTIC_MEMORY = localStorage.getItem('beta_semantic_memory') === 'true';

const memoryManager = USE_SEMANTIC_MEMORY
  ? new SemanticMemoryManager()
  : new LegacyMemoryManager();
```

---

## Performance Considerations

### Embedding Generation

**Optimization:**
- Cache embeddings (don't regenerate)
- Batch processing for bulk operations
- Web Worker for background processing
- Lazy loading of model

**Benchmarks:**
- transformers.js: ~50ms per encoding (after model load)
- OpenAI API: ~200ms per request (network latency)
- Model load time: ~3s (first time, then cached)

### Vector Search

**Optimization:**
- Pre-filter by metadata before similarity calculation
- Use approximate nearest neighbor (ANN) for large datasets
- Index frequently accessed memories

**Benchmarks:**
- Cosine similarity: ~0.1ms per comparison (Float32Array)
- 100 memories: ~10ms
- 1000 memories: ~100ms

### Storage

**Optimization:**
- Compress embeddings (Float16 instead of Float32)
- Store frequently accessed memories in memory cache
- Lazy load embeddings only when needed

**Storage sizes:**
- Text: ~1KB per memory
- Embedding (1536 dims): ~6KB
- Metadata: ~0.5KB
- Total: ~7.5KB per memory

**Limits:**
- IndexedDB: 50MB - 1GB (browser dependent)
- Can store ~6,000 - 130,000 memories

### Context Building

**Optimization:**
- Calculate token counts upfront
- Use summarized versions for old memories
- Dynamic compression based on available tokens

**Token budget:**
- GPT-4: 8K - 128K tokens
- Reserve: 2K for prompt, 2K for response
- Available for memories: 4K - 124K

---

## Future Enhancements

### Advanced Features

1. **Memory Consolidation**
   - Automatically merge similar memories
   - Create hierarchical summaries
   - Reduce redundancy

2. **Federated Memory**
   - Share memories across users (opt-in)
   - Collective knowledge base
   - Privacy-preserving aggregation

3. **Episodic Memory**
   - Remember conversation sequences
   - Temporal relationships
   - Story-like recall

4. **Meta-Memory**
   - Learn what types of memories are useful
   - Optimize retrieval strategies
   - Self-improving memory system

5. **Multi-Modal Memory**
   - Store images, code snippets
   - Cross-modal retrieval
   - Rich context representation

### Research Directions

1. **Adaptive Retrieval**
   - Learn user preferences
   - A/B test different strategies
   - Personalized ranking

2. **Memory Quality Scoring**
   - Predict usefulness before retrieval
   - Filter low-quality memories
   - Active learning for relevance

3. **Distributed Memory**
   - Split across devices
   - P2P memory sharing
   - Blockchain for provenance

---

## Conclusion

This architecture provides a clear path from the current keyword-based system to a sophisticated semantic memory system with:

- ✅ Semantic understanding via embeddings
- ✅ Long-term and short-term memory tiers
- ✅ Advanced hybrid retrieval
- ✅ Intelligent summarization
- ✅ Scalable storage with IndexedDB
- ✅ Privacy-first with client-side processing

**Recommended Approach:**
1. Start with transformers.js + IndexedDB (Phase 1-2)
2. Validate with user testing
3. Optimize based on real usage
4. Consider premium features (OpenAI, cloud storage) later

**Timeline:** 12 weeks for full implementation  
**Complexity:** Medium-High  
**Impact:** High - significantly improves Council's intelligence

---

## References

- [transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Paper](https://arxiv.org/abs/2005.11401)
- [Sentence Transformers](https://www.sbert.net/)

