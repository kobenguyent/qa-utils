import { describe, it, expect } from 'vitest';
import {
  toPostman,
  toInsomnia,
  toThunderClient,
  toEnv,
  toCsv,
  toGenericJson,
  convertCollection,
} from '../collectionConverter';
import { parseInsomnia } from '../collectionParser';
import { UnifiedCollection } from '../types/collectionTypes';

describe('collectionConverter', () => {
  const sampleCollection: UnifiedCollection = {
    id: 'test_col',
    name: 'Test Collection',
    description: 'Test description',
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

  describe('toPostman', () => {
    it('should convert to Postman format', () => {
      const result = toPostman(sampleCollection);
      expect(result.info.name).toBe('Test Collection');
      expect(result.variable).toHaveLength(2);
      expect(result.item).toHaveLength(1);
      expect(result.item[0].name).toBe('Get Users');
    });

    it('should handle folders', () => {
      const collectionWithFolder: UnifiedCollection = {
        ...sampleCollection,
        folders: [
          {
            id: 'folder1',
            name: 'Auth',
            requests: [
              {
                id: 'req2',
                name: 'Login',
                method: 'POST',
                url: '/login',
                headers: [],
              },
            ],
            folders: [],
          },
        ],
      };

      const result = toPostman(collectionWithFolder);
      expect(result.item).toHaveLength(2);
      expect(result.item[1].name).toBe('Auth');
    });
  });

  describe('toInsomnia', () => {
    it('should convert to Insomnia format', () => {
      const result = toInsomnia(sampleCollection);
      expect(result._type).toBe('export');
      expect(result.__export_format).toBe(4);
      expect(result.resources).toHaveLength(3); // workspace + environment + request
    });

    it('should create environment with variables', () => {
      const result = toInsomnia(sampleCollection);
      const env = result.resources.find(r => r._type === 'environment');
      expect(env).toBeDefined();
      expect((env as any).data).toHaveProperty('apiKey');
    });
  });

  describe('toThunderClient', () => {
    it('should convert to Thunder Client format', () => {
      const result = toThunderClient(sampleCollection);
      expect(result.colName).toBe('Test Collection');
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].method).toBe('GET');
    });
  });

  describe('toEnv', () => {
    it('should convert to .env format', () => {
      const result = toEnv(sampleCollection);
      expect(result).toContain('apiKey=secret123');
      expect(result).toContain('baseUrl=https://api.example.com');
    });

    it('should skip disabled variables', () => {
      const collection: UnifiedCollection = {
        ...sampleCollection,
        variables: [
          { id: 'v1', key: 'enabled', value: 'yes', type: 'default', enabled: true },
          { id: 'v2', key: 'disabled', value: 'no', type: 'default', enabled: false },
        ],
      };

      const result = toEnv(collection);
      expect(result).toContain('enabled=yes');
      expect(result).not.toContain('disabled=no');
    });
  });

  describe('toCsv', () => {
    it('should convert to CSV format', () => {
      const result = toCsv(sampleCollection);
      expect(result).toContain('key,value,type,description,enabled');
      expect(result).toContain('"apiKey","secret123","secret"');
      expect(result).toContain('"baseUrl","https://api.example.com","default"');
    });
  });

  describe('toGenericJson', () => {
    it('should convert to generic JSON', () => {
      const result = toGenericJson(sampleCollection);
      expect(result).toHaveProperty('apiKey', 'secret123');
      expect(result).toHaveProperty('baseUrl', 'https://api.example.com');
    });

    it('should only include enabled variables', () => {
      const collection: UnifiedCollection = {
        ...sampleCollection,
        variables: [
          { id: 'v1', key: 'enabled', value: 'yes', type: 'default', enabled: true },
          { id: 'v2', key: 'disabled', value: 'no', type: 'default', enabled: false },
        ],
      };

      const result = toGenericJson(collection);
      expect(result).toHaveProperty('enabled');
      expect(result).not.toHaveProperty('disabled');
    });
  });

  describe('convertCollection', () => {
    it('should convert to specified format', () => {
      const result = convertCollection(sampleCollection, 'postman');
      expect(result).toContain('"name": "Test Collection"');
      expect(JSON.parse(result).info.name).toBe('Test Collection');
    });

    it('should handle env format', () => {
      const result = convertCollection(sampleCollection, 'env');
      expect(result).toContain('apiKey=secret123');
    });

    it('should handle csv format', () => {
      const result = convertCollection(sampleCollection, 'csv');
      expect(result).toContain('key,value,type');
    });

    it('should throw error for unsupported format', () => {
      expect(() => convertCollection(sampleCollection, 'unknown' as any)).toThrow();
    });
  });

  describe('script preservation', () => {
    const collectionWithScripts: UnifiedCollection = {
      id: 'test_scripts',
      name: 'Collection with Scripts',
      description: 'Test scripts',
      version: '1.0',
      variables: [],
      folders: [],
      requests: [
        {
          id: 'req1',
          name: 'Request with Scripts',
          method: 'POST',
          url: 'https://api.example.com/test',
          headers: [],
          preRequestScript: 'console.log("pre-request");',
          testScript: 'console.log("test");',
        },
      ],
      sourceFormat: 'postman',
      type: 'collection',
      preRequestScript: 'console.log("collection pre-request");',
      testScript: 'console.log("collection test");',
    };

    it('should preserve scripts when converting to Insomnia', () => {
      const result = toInsomnia(collectionWithScripts);
      const request = result.resources.find(r => r._type === 'request');
      expect(request?.preRequestScript).toBe('console.log("pre-request");');
      expect(request?.afterResponseScript).toBe('console.log("test");');
    });

    it('should preserve scripts when converting to Thunder Client', () => {
      const result = toThunderClient(collectionWithScripts);
      expect(result.requests[0].tests).toEqual(['console.log("test");']);
    });

    it('should preserve scripts when converting to Postman', () => {
      const result = toPostman(collectionWithScripts);
      const requestEvent = result.item[0].event;
      expect(requestEvent).toBeDefined();
      expect(requestEvent?.find(e => e.listen === 'prerequest')?.script.exec).toEqual(['console.log("pre-request");']);
      expect(requestEvent?.find(e => e.listen === 'test')?.script.exec).toEqual(['console.log("test");']);
    });

    it('should preserve scripts in round-trip Postman → Insomnia → Parse', () => {
      // Convert Postman to Insomnia
      const insomniaExport = toInsomnia(collectionWithScripts);
      
      // Parse back from Insomnia format
      const parsedCollection = parseInsomnia(insomniaExport);
      
      // Verify scripts are preserved
      expect(parsedCollection.requests[0].preRequestScript).toBe('console.log("pre-request");');
      expect(parsedCollection.requests[0].testScript).toBe('console.log("test");');
      expect(parsedCollection.preRequestScript).toBe('console.log("collection pre-request");');
      expect(parsedCollection.testScript).toBe('console.log("collection test");');
    });
  });
});
