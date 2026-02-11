import { describe, it, expect } from 'vitest';
import {
  detectFormat,
  parsePostman,
  parseInsomnia,
  parseThunderClient,
  parseEnv,
  parseCsv,
  parseGenericJson,
} from '../collectionParser';
import { PostmanCollection, InsomniaExport, ThunderClientCollection } from '../types/collectionTypes';

describe('collectionParser', () => {
  describe('detectFormat', () => {
    it('should detect Postman collection', () => {
      const data = { info: { schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' } };
      expect(detectFormat(data)).toBe('postman');
    });

    it('should detect Postman environment', () => {
      const data = { _postman_variable_scope: 'environment', values: [] };
      expect(detectFormat(data)).toBe('postman');
    });

    it('should detect Insomnia export', () => {
      const data = { _type: 'export', __export_format: 4, resources: [] };
      expect(detectFormat(data)).toBe('insomnia');
    });

    it('should detect Thunder Client', () => {
      const data = { colName: 'Test', requests: [] };
      expect(detectFormat(data)).toBe('thunderclient');
    });

    it('should default to json for unknown formats', () => {
      const data = { key: 'value' };
      expect(detectFormat(data)).toBe('json');
    });
  });

  describe('parsePostman', () => {
    it('should parse Postman collection', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com', type: 'default' },
        ],
        item: [
          {
            name: 'Get Users',
            request: {
              method: 'GET',
              url: '{{baseUrl}}/users',
              header: [{ key: 'Authorization', value: 'Bearer token' }],
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.name).toBe('Test Collection');
      expect(result.type).toBe('collection');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].key).toBe('baseUrl');
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].name).toBe('Get Users');
    });

    it('should add Content-Type header for JSON body when missing', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'POST with JSON',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              header: [],
              body: {
                raw: '{"name": "John", "age": 30}',
              },
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers).toHaveLength(1);
      expect(result.requests[0].headers[0].key).toBe('Content-Type');
      expect(result.requests[0].headers[0].value).toBe('application/json');
    });

    it('should replace text/plain with application/json for JSON body', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'POST with text/plain',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              header: [
                { key: 'Content-Type', value: 'text/plain' }
              ],
              body: {
                raw: '{"name": "Jane", "age": 25}',
              },
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers).toHaveLength(1);
      expect(result.requests[0].headers[0].key).toBe('Content-Type');
      expect(result.requests[0].headers[0].value).toBe('application/json');
    });

    it('should not modify existing application/json Content-Type', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'POST with JSON',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              header: [
                { key: 'Content-Type', value: 'application/json' }
              ],
              body: {
                raw: '{"name": "Bob"}',
              },
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers).toHaveLength(1);
      expect(result.requests[0].headers[0].value).toBe('application/json');
    });

    it('should handle text/plain with charset parameter', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'POST with text/plain; charset=utf-8',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              header: [
                { key: 'Content-Type', value: 'text/plain; charset=utf-8' }
              ],
              body: {
                raw: '{"name": "Jane"}',
              },
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers).toHaveLength(1);
      expect(result.requests[0].headers[0].value).toBe('application/json');
    });

    it('should not add Content-Type for non-JSON body', () => {
      const collection: PostmanCollection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'POST with plain text',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              header: [],
              body: {
                raw: 'plain text data',
              },
            },
          },
        ],
      };

      const result = parsePostman(collection);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers).toHaveLength(0);
    });

    it('should parse Postman environment', () => {
      const env = {
        name: 'Dev Environment',
        values: [
          { key: 'apiKey', value: 'secret123', type: 'secret' },
        ],
        _postman_variable_scope: 'environment',
      };

      const result = parsePostman(env as any);
      expect(result.name).toBe('Dev Environment');
      expect(result.type).toBe('environment');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].type).toBe('secret');
    });
  });

  describe('parseInsomnia', () => {
    it('should parse Insomnia export', () => {
      const data: InsomniaExport = {
        _type: 'export',
        __export_format: 4,
        resources: [
          {
            _id: 'wrk_1',
            _type: 'workspace',
            name: 'Test Workspace',
          },
          {
            _id: 'env_1',
            _type: 'environment',
            name: 'Base',
            data: { apiUrl: 'https://api.test.com' },
          },
          {
            _id: 'req_1',
            _type: 'request',
            name: 'Get Data',
            method: 'GET',
            url: '{{apiUrl}}/data',
            parentId: 'wrk_1',
          },
        ],
      };

      const result = parseInsomnia(data);
      expect(result.name).toBe('Test Workspace');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].key).toBe('apiUrl');
      expect(result.requests).toHaveLength(1);
    });
  });

  describe('parseThunderClient', () => {
    it('should parse Thunder Client collection', () => {
      const data: ThunderClientCollection = {
        _id: 'col_1',
        colName: 'API Tests',
        created: '2024-01-01',
        requests: [
          {
            _id: 'req_1',
            colId: 'col_1',
            name: 'Test Request',
            url: 'https://api.example.com/test',
            method: 'POST',
            headers: [{ name: 'Content-Type', value: 'application/json', active: true }],
          },
        ],
      };

      const result = parseThunderClient(data);
      expect(result.name).toBe('API Tests');
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].method).toBe('POST');
    });
  });

  describe('parseEnv', () => {
    it('should parse .env file', () => {
      const content = `
# API Configuration
API_KEY=secret123
BASE_URL=https://api.example.com
PORT=3000
      `.trim();

      const result = parseEnv(content);
      expect(result.variables).toHaveLength(3);
      expect(result.variables[0].key).toBe('API_KEY');
      expect(result.variables[0].value).toBe('secret123');
    });

    it('should handle quoted values', () => {
      const content = 'MESSAGE="Hello World"';
      const result = parseEnv(content);
      expect(result.variables[0].value).toBe('Hello World');
    });
  });

  describe('parseCsv', () => {
    it('should parse CSV file', () => {
      const content = `key,value,type,description,enabled
apiKey,secret123,secret,API Key,true
baseUrl,https://api.com,default,Base URL,true`;

      const result = parseCsv(content);
      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].key).toBe('apiKey');
      expect(result.variables[0].type).toBe('secret');
    });
  });

  describe('parseGenericJson', () => {
    it('should parse generic JSON object', () => {
      const data = {
        apiKey: 'test123',
        baseUrl: 'https://api.example.com',
        timeout: '5000',
      };

      const result = parseGenericJson(data);
      expect(result.variables).toHaveLength(3);
      expect(result.variables[0].key).toBe('apiKey');
    });
  });
});
