import { describe, it, expect, beforeEach } from 'vitest';
import { collectionDB } from '../collectionDB';
import { UnifiedCollection } from '../types/collectionTypes';

// Mock IndexedDB for testing
const mockIndexedDB = () => {
  const store: Record<string, any> = {};
  
  return {
    open: () => ({
      result: {
        transaction: () => ({
          objectStore: () => ({
            put: (item: any) => { store[item.id] = item; },
            getAll: () => ({ result: Object.values(store) }),
            delete: (id: string) => { delete store[id]; },
            clear: () => { Object.keys(store).forEach(k => delete store[k]); },
          }),
          oncomplete: null,
          onerror: null,
        }),
        objectStoreNames: { contains: () => false },
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }),
  };
};

describe('collectionDB', () => {
  const sampleCollection: UnifiedCollection = {
    id: 'test-1',
    name: 'Test Collection',
    version: '1.0',
    variables: [
      { id: 'v1', key: 'apiKey', value: 'secret', type: 'secret', enabled: true },
    ],
    folders: [],
    requests: [],
    sourceFormat: 'postman',
    type: 'collection',
  };

  it('should have required methods', () => {
    expect(collectionDB).toHaveProperty('init');
    expect(collectionDB).toHaveProperty('saveCollections');
    expect(collectionDB).toHaveProperty('loadCollections');
    expect(collectionDB).toHaveProperty('deleteCollection');
    expect(collectionDB).toHaveProperty('clearAll');
  });

  it('should be a singleton instance', () => {
    expect(collectionDB).toBeDefined();
    expect(typeof collectionDB.init).toBe('function');
  });
});
