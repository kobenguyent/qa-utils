/**
 * Knowledge Manager for AI Chat
 * Implements CAG (Cache-Augmented Generation) and various retrieval methods
 */

export interface KnowledgeDocument {
  id: string;
  content: string;
  metadata: {
    filename?: string;
    type?: string;
    uploadedAt: number;
    keywords?: string[];
    [key: string]: unknown;
  };
}

export interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export interface SearchOptions {
  method: 'keyword' | 'metadata' | 'semantic';
  limit?: number;
  threshold?: number;
}

/**
 * Cache-Augmented Generation (CAG) Manager
 * Provides efficient caching for frequently accessed knowledge
 */
export class CAGManager {
  private cache: Map<string, CacheEntry>;
  private maxCacheSize: number;

  constructor(maxCacheSize = 100) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Set a cache entry
   */
  set(key: string, value: string, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a cache entry
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Could be calculated with hit/miss counters
    };
  }
}

/**
 * Knowledge Base Manager
 * Manages uploaded documents and provides various retrieval methods
 */
export class KnowledgeBase {
  private documents: Map<string, KnowledgeDocument>;
  private cagManager: CAGManager;

  constructor() {
    this.documents = new Map();
    this.cagManager = new CAGManager();
  }

  /**
   * Add a document to the knowledge base
   */
  addDocument(content: string, metadata: Partial<KnowledgeDocument['metadata']> = {}): string {
    const id = crypto.randomUUID();
    const keywords = this.extractKeywords(content);

    const document: KnowledgeDocument = {
      id,
      content,
      metadata: {
        ...metadata,
        uploadedAt: Date.now(),
        keywords,
      },
    };

    this.documents.set(id, document);
    return id;
  }

  /**
   * Remove a document from the knowledge base
   */
  removeDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Get a document by ID
   */
  getDocument(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * List all documents
   */
  listDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Search documents using keyword search
   */
  keywordSearch(query: string, limit = 5): KnowledgeDocument[] {
    const queryKeywords = this.extractKeywords(query);
    const results: Array<{ document: KnowledgeDocument; score: number }> = [];

    for (const document of this.documents.values()) {
      const docKeywords = document.metadata.keywords || [];
      const score = this.calculateKeywordScore(queryKeywords, docKeywords, document.content);
      
      if (score > 0) {
        results.push({ document, score });
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.document);
  }

  /**
   * Search documents by metadata filtering
   */
  metadataSearch(filters: Record<string, unknown>, limit = 5): KnowledgeDocument[] {
    const results: KnowledgeDocument[] = [];

    for (const document of this.documents.values()) {
      let matches = true;

      for (const [key, value] of Object.entries(filters)) {
        if (document.metadata[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(document);
        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Search documents with caching
   */
  search(query: string, options: SearchOptions = { method: 'keyword', limit: 5 }): KnowledgeDocument[] {
    const cacheKey = `search:${options.method}:${query}`;
    const cached = this.cagManager.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    let results: KnowledgeDocument[];

    switch (options.method) {
      case 'keyword':
        results = this.keywordSearch(query, options.limit);
        break;
      case 'metadata':
        // Parse query as JSON for metadata search
        try {
          const filters = JSON.parse(query);
          results = this.metadataSearch(filters, options.limit);
        } catch {
          results = [];
        }
        break;
      case 'semantic':
        // Fallback to keyword search for semantic (would need embeddings for true semantic search)
        results = this.keywordSearch(query, options.limit);
        break;
      default:
        results = [];
    }

    // Cache results for 5 minutes
    this.cagManager.set(cacheKey, JSON.stringify(results), 5 * 60 * 1000);
    return results;
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    // Convert to lowercase, split by non-word characters, filter out short words and common words
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(queryKeywords: string[], docKeywords: string[], content: string): number {
    let score = 0;

    // Check keyword matches
    for (const qKeyword of queryKeywords) {
      if (docKeywords.includes(qKeyword)) {
        score += 2; // Higher weight for metadata keyword matches
      }
      if (content.toLowerCase().includes(qKeyword)) {
        score += 1; // Weight for content matches
      }
    }

    return score;
  }

  /**
   * Build context from search results for LLM
   */
  buildContext(documents: KnowledgeDocument[], maxLength = 4000): string {
    let context = 'Relevant information from knowledge base:\n\n';
    let currentLength = context.length;

    for (const doc of documents) {
      const docContext = `[${doc.metadata.filename || 'Document'}]\n${doc.content}\n\n`;
      
      if (currentLength + docContext.length > maxLength) {
        // Truncate if needed
        const remaining = maxLength - currentLength;
        if (remaining > 100) {
          context += docContext.substring(0, remaining - 3) + '...';
        }
        break;
      }

      context += docContext;
      currentLength += docContext.length;
    }

    return context;
  }

  /**
   * Clear all documents and cache
   */
  clear(): void {
    this.documents.clear();
    this.cagManager.clear();
  }

  /**
   * Get knowledge base statistics
   */
  getStats(): { documentCount: number; cacheStats: ReturnType<CAGManager['getStats']> } {
    return {
      documentCount: this.documents.size,
      cacheStats: this.cagManager.getStats(),
    };
  }
}

/**
 * Parse PDF file content
 */
async function parsePDFContent(file: File): Promise<string> {
  try {
    // Dynamic import to avoid issues with SSR and reduce bundle size
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker path - using local worker from pdfjs-dist package
    // This works with Vite's asset handling
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Parse uploaded file content
 */
export async function parseFileContent(file: File): Promise<string> {
  // Handle PDF files separately
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePDFContent(file);
  }

  // Handle text files
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('File content is not a string'));
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`Failed to read file: ${error}`));
    };

    reader.readAsText(file);
  });
}
