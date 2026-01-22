import { describe, it, expect } from 'vitest';
import {
  findInCollection,
  replaceInCollection,
  bulkEditVariables,
  exportVariables,
  importVariables,
} from '../collectionBulkOps';
import { UnifiedCollection } from '../types/collectionTypes';

describe('collectionBulkOps', () => {
  const sampleCollection: UnifiedCollection = {
    id: 'test_col',
    name: 'Test Collection',
    version: '1.0',
    variables: [
      {
        id: 'var1',
        key: 'apiKey',
        value: 'secret123',
        type: 'secret',
        enabled: true,
      },
      {
        id: 'var2',
        key: 'baseUrl',
        value: 'https://api.example.com',
        type: 'default',
        enabled: true,
      },
    ],
    folders: [],
    requests: [
      {
        id: 'req1',
        name: 'Get Users',
        method: 'GET',
        url: '{{baseUrl}}/users',
        headers: [
          { key: 'Authorization', value: 'Bearer {{apiKey}}', enabled: true },
        ],
      },
    ],
    sourceFormat: 'postman',
    type: 'collection',
  };

  describe('findInCollection', () => {
    it('should find in variables', () => {
      const results = findInCollection(sampleCollection, 'apiKey', 'variables');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].field).toBe('key');
    });

    it('should find in requests', () => {
      const results = findInCollection(sampleCollection, 'users', 'requests');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('url');
    });

    it('should find in all scopes', () => {
      const results = findInCollection(sampleCollection, 'api', 'all');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case insensitive by default', () => {
      const results = findInCollection(sampleCollection, 'APIKEY', 'variables', false);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should support case sensitive search', () => {
      const results = findInCollection(sampleCollection, 'APIKEY', 'variables', true);
      expect(results.length).toBe(0);
    });
  });

  describe('replaceInCollection', () => {
    it('should replace in variables', () => {
      const result = replaceInCollection(sampleCollection, {
        find: 'secret123',
        replace: 'newSecret',
        scope: 'variables',
      });

      expect(result.count).toBe(1);
      expect(result.collection.variables[0].value).toBe('newSecret');
    });

    it('should replace in requests', () => {
      const result = replaceInCollection(sampleCollection, {
        find: 'users',
        replace: 'customers',
        scope: 'requests',
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.collection.requests[0].url).toContain('customers');
    });

    it('should replace in all scopes', () => {
      const result = replaceInCollection(sampleCollection, {
        find: 'api',
        replace: 'service',
        scope: 'all',
      });

      expect(result.count).toBeGreaterThan(0);
    });

    it('should support case sensitive replace', () => {
      const result = replaceInCollection(sampleCollection, {
        find: 'API',
        replace: 'SERVICE',
        scope: 'all',
        caseSensitive: true,
      });

      expect(result.count).toBe(0);
    });

    it('should not modify original collection', () => {
      const originalValue = sampleCollection.variables[0].value;
      replaceInCollection(sampleCollection, {
        find: 'secret',
        replace: 'new',
        scope: 'variables',
      });

      expect(sampleCollection.variables[0].value).toBe(originalValue);
    });
  });

  describe('bulkEditVariables', () => {
    it('should update multiple variables', () => {
      const updates = [
        { id: 'var1', value: 'newSecret' },
        { id: 'var2', enabled: false },
      ];

      const result = bulkEditVariables(sampleCollection, updates);
      expect(result.variables[0].value).toBe('newSecret');
      expect(result.variables[1].enabled).toBe(false);
    });

    it('should not modify original collection', () => {
      const originalValue = sampleCollection.variables[0].value;
      bulkEditVariables(sampleCollection, [{ id: 'var1', value: 'changed' }]);
      expect(sampleCollection.variables[0].value).toBe(originalValue);
    });
  });

  describe('exportVariables', () => {
    it('should export as JSON', () => {
      const result = exportVariables(sampleCollection, 'json');
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toHaveProperty('key');
      expect(parsed[0]).toHaveProperty('value');
    });

    it('should export as CSV', () => {
      const result = exportVariables(sampleCollection, 'csv');
      expect(result).toContain('key,value,type,description,enabled');
      expect(result).toContain('"apiKey","secret123"');
    });
  });

  describe('importVariables', () => {
    it('should import from JSON', () => {
      const jsonData = JSON.stringify([
        { key: 'newVar', value: 'newValue', type: 'default', enabled: true },
      ]);

      const result = importVariables(sampleCollection, jsonData, 'json');
      expect(result.variables.length).toBe(3);
      expect(result.variables[2].key).toBe('newVar');
    });

    it('should import from CSV', () => {
      const csvData = `key,value,type,description,enabled
newVar,newValue,default,Test,true`;

      const result = importVariables(sampleCollection, csvData, 'csv');
      expect(result.variables.length).toBe(3);
      expect(result.variables[2].key).toBe('newVar');
    });

    it('should not modify original collection', () => {
      const originalLength = sampleCollection.variables.length;
      const jsonData = JSON.stringify([{ key: 'test', value: 'test' }]);
      importVariables(sampleCollection, jsonData, 'json');
      expect(sampleCollection.variables.length).toBe(originalLength);
    });
  });
});
