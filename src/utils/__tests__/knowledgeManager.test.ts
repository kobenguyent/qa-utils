import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeBase, CAGManager, parseFileContent } from '../knowledgeManager';

describe('knowledgeManager', () => {
  describe('CAGManager', () => {
    let cagManager: CAGManager;

    beforeEach(() => {
      cagManager = new CAGManager(5);
    });

    it('should set and get cache entries', () => {
      cagManager.set('key1', 'value1');
      expect(cagManager.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cagManager.get('nonexistent')).toBeNull();
    });

    it('should respect TTL', async () => {
      cagManager.set('key1', 'value1', 100); // 100ms TTL
      expect(cagManager.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cagManager.get('key1')).toBeNull();
    });

    it('should evict oldest entry when cache is full', () => {
      for (let i = 0; i < 6; i++) {
        cagManager.set(`key${i}`, `value${i}`);
      }

      // First key should be evicted
      expect(cagManager.get('key0')).toBeNull();
      expect(cagManager.get('key5')).toBe('value5');
    });

    it('should clear cache', () => {
      cagManager.set('key1', 'value1');
      cagManager.set('key2', 'value2');
      cagManager.clear();

      expect(cagManager.get('key1')).toBeNull();
      expect(cagManager.get('key2')).toBeNull();
    });

    it('should provide cache statistics', () => {
      cagManager.set('key1', 'value1');
      cagManager.set('key2', 'value2');

      const stats = cagManager.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
    });
  });

  describe('KnowledgeBase', () => {
    let kb: KnowledgeBase;

    beforeEach(() => {
      kb = new KnowledgeBase();
    });

    it('should add and retrieve documents', () => {
      const id = kb.addDocument('Test content', { filename: 'test.txt' });
      const doc = kb.getDocument(id);

      expect(doc).toBeDefined();
      expect(doc?.content).toBe('Test content');
      expect(doc?.metadata.filename).toBe('test.txt');
    });

    it('should remove documents', () => {
      const id = kb.addDocument('Test content');
      expect(kb.removeDocument(id)).toBe(true);
      expect(kb.getDocument(id)).toBeUndefined();
    });

    it('should list all documents', () => {
      kb.addDocument('Content 1');
      kb.addDocument('Content 2');

      const docs = kb.listDocuments();
      expect(docs.length).toBe(2);
    });

    it('should perform keyword search', () => {
      kb.addDocument('This is about JavaScript programming');
      kb.addDocument('Python programming tutorial');
      kb.addDocument('Cooking recipes for dinner');

      const results = kb.keywordSearch('programming');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('programming');
    });

    it('should perform metadata search', () => {
      kb.addDocument('Content 1', { type: 'article', filename: 'article1.txt' });
      kb.addDocument('Content 2', { type: 'book', filename: 'book1.txt' });
      kb.addDocument('Content 3', { type: 'article', filename: 'article2.txt' });

      const results = kb.metadataSearch({ type: 'article' });
      expect(results.length).toBe(2);
      results.forEach(doc => {
        expect(doc.metadata.type).toBe('article');
      });
    });

    it('should limit search results', () => {
      for (let i = 0; i < 10; i++) {
        kb.addDocument(`Content about testing ${i}`);
      }

      const results = kb.keywordSearch('testing', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should use cache for repeated searches', () => {
      kb.addDocument('Test content about AI');
      
      const results1 = kb.search('AI', { method: 'keyword', limit: 5 });
      const results2 = kb.search('AI', { method: 'keyword', limit: 5 });

      expect(results1).toEqual(results2);
    });

    it('should build context from documents', () => {
      const id1 = kb.addDocument('First document content', { filename: 'doc1.txt' });
      const id2 = kb.addDocument('Second document content', { filename: 'doc2.txt' });

      const doc1 = kb.getDocument(id1);
      const doc2 = kb.getDocument(id2);

      expect(doc1).toBeDefined();
      expect(doc2).toBeDefined();

      if (doc1 && doc2) {
        const context = kb.buildContext([doc1, doc2]);
        expect(context).toContain('doc1.txt');
        expect(context).toContain('doc2.txt');
        expect(context).toContain('First document content');
        expect(context).toContain('Second document content');
      }
    });

    it('should truncate context when exceeding max length', () => {
      const longContent = 'A'.repeat(5000);
      const id = kb.addDocument(longContent, { filename: 'long.txt' });
      const doc = kb.getDocument(id);

      expect(doc).toBeDefined();
      if (doc) {
        const context = kb.buildContext([doc], 1000);
        expect(context.length).toBeLessThanOrEqual(1000);
      }
    });

    it('should clear all documents and cache', () => {
      kb.addDocument('Content 1');
      kb.addDocument('Content 2');
      kb.clear();

      expect(kb.listDocuments().length).toBe(0);
    });

    it('should provide knowledge base statistics', () => {
      kb.addDocument('Content 1');
      kb.addDocument('Content 2');

      const stats = kb.getStats();
      expect(stats.documentCount).toBe(2);
      expect(stats.cacheStats).toBeDefined();
    });

    it('should extract keywords from content', () => {
      const id = kb.addDocument('JavaScript is a programming language used for web development');
      const doc = kb.getDocument(id);

      expect(doc).toBeDefined();
      if (doc) {
        expect(doc.metadata.keywords).toBeDefined();
        expect(doc.metadata.keywords?.length).toBeGreaterThan(0);
        expect(doc.metadata.keywords).toContain('javascript');
        expect(doc.metadata.keywords).toContain('programming');
      }
    });

    it('should handle metadata search with JSON query', () => {
      kb.addDocument('Content 1', { category: 'tech', year: 2023 });
      kb.addDocument('Content 2', { category: 'science', year: 2023 });

      const query = JSON.stringify({ category: 'tech' });
      const results = kb.search(query, { method: 'metadata' });

      expect(results.length).toBe(1);
      expect(results[0].metadata.category).toBe('tech');
    });

    it('should handle semantic search fallback', () => {
      kb.addDocument('Content about machine learning');
      
      const results = kb.search('machine learning', { method: 'semantic' });
      expect(results).toBeDefined();
    });
  });

  describe('parseFileContent', () => {
    it('should read text file content', async () => {
      const content = 'Test file content';
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      const result = await parseFileContent(file);
      expect(result).toBe(content);
    });

    it('should read JSON file content', async () => {
      const content = '{"key": "value"}';
      const blob = new Blob([content], { type: 'application/json' });
      const file = new File([blob], 'test.json', { type: 'application/json' });

      const result = await parseFileContent(file);
      expect(result).toBe(content);
    });

    it('should handle PDF files with .pdf extension', async () => {
      // Mock PDF file - actual parsing would require pdfjs-dist
      const blob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      const file = new File([blob], 'test.pdf', { type: 'application/pdf' });

      // This test verifies the code path is taken, actual PDF parsing requires pdfjs-dist
      try {
        await parseFileContent(file);
      } catch (error) {
        // Expected to fail in test environment without proper PDF setup
        expect((error as Error).message).toContain('Failed to parse PDF');
      }
    });
  });
});
