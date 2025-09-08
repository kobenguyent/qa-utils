import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makeRequest,
  parseCurlCommand,
  curlToRequestConfig,
  requestConfigToCurl,
  isValidUrl,
  formatJsonResponse,
  RequestConfig,
} from '../restClient';

// Mock axios using vi.hoisted to ensure it runs before imports
const { mockedAxios } = vi.hoisted(() => {
  const mockedAxios = vi.fn();
  return { mockedAxios };
});

vi.mock('axios', () => ({
  default: mockedAxios,
}));

describe('restClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('makeRequest', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: '{"message": "success"}',
      };

      mockedAxios.mockResolvedValueOnce(mockResponse);

      const config: RequestConfig = {
        url: 'https://api.example.com/users',
        method: 'GET',
      };

      const result = await makeRequest(config);

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.data).toBe('{"message": "success"}');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should make successful POST request with body', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: '{"id": 1, "name": "John"}',
      };

      mockedAxios.mockResolvedValueOnce(mockResponse);

      const config: RequestConfig = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Authorization': 'Bearer token' },
        body: '{"name": "John"}',
      };

      await makeRequest(config);

      expect(mockedAxios).toHaveBeenCalledWith({
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        timeout: 30000,
        data: '{"name": "John"}',
        transformResponse: expect.any(Array),
      });
    });

    it('should handle error responses', async () => {
      const mockError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
          data: '{"error": "Not found"}',
        },
      };

      mockedAxios.mockRejectedValueOnce(mockError);

      const config: RequestConfig = {
        url: 'https://api.example.com/users/999',
        method: 'GET',
      };

      const result = await makeRequest(config);

      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.data).toBe('{"error": "Not found"}');
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockedAxios.mockRejectedValueOnce(mockError);

      const config: RequestConfig = {
        url: 'https://api.example.com/users',
        method: 'GET',
      };

      await expect(makeRequest(config)).rejects.toThrow('Network error: Network Error');
    });

    it('should handle request setup errors', async () => {
      const mockError = {
        message: 'Invalid URL',
      };

      mockedAxios.mockRejectedValueOnce(mockError);

      const config: RequestConfig = {
        url: 'invalid-url',
        method: 'GET',
      };

      await expect(makeRequest(config)).rejects.toThrow('Request error: Invalid URL');
    });
  });

  describe('parseCurlCommand', () => {
    it('should parse simple GET request', () => {
      const curl = 'curl https://api.example.com/users';
      const result = parseCurlCommand(curl);

      expect(result).toEqual({
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: undefined,
      });
    });

    it('should parse POST request with headers and body', () => {
      const curl = `curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer token" -d '{"name": "John"}' https://api.example.com/users`;
      const result = parseCurlCommand(curl);

      expect(result).toEqual({
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: '{"name": "John"}',
      });
    });

    it('should parse curl with quoted URL', () => {
      const curl = `curl "https://api.example.com/users?page=1"`;
      const result = parseCurlCommand(curl);

      expect(result.url).toBe('https://api.example.com/users?page=1');
    });

    it('should parse curl with --request and --header flags', () => {
      const curl = `curl --request PUT --header "Content-Type: application/json" --data '{"name": "Jane"}' https://api.example.com/users/1`;
      const result = parseCurlCommand(curl);

      expect(result.method).toBe('PUT');
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.body).toBe('{"name": "Jane"}');
    });

    it('should default to POST when body is provided without explicit method', () => {
      const curl = `curl -d '{"test": true}' https://api.example.com/test`;
      const result = parseCurlCommand(curl);

      expect(result.method).toBe('POST');
      expect(result.body).toBe('{"test": true}');
    });

    it('should throw error for invalid curl command', () => {
      expect(() => parseCurlCommand('wget https://example.com')).toThrow('Invalid curl command: must start with "curl"');
    });

    it('should throw error for curl without URL', () => {
      expect(() => parseCurlCommand('curl -H "test: value"')).toThrow('Invalid curl command: URL not found');
    });

    it('should handle headers with colons in values', () => {
      const curl = `curl -H "X-Custom-Header: value:with:colons" https://api.example.com`;
      const result = parseCurlCommand(curl);

      expect(result.headers['X-Custom-Header']).toBe('value:with:colons');
    });
  });

  describe('curlToRequestConfig', () => {
    it('should convert curl to RequestConfig', () => {
      const curl = `curl -X POST -H "Content-Type: application/json" -d '{"test": true}' https://api.example.com/test`;
      const result = curlToRequestConfig(curl);

      expect(result).toEqual({
        url: 'https://api.example.com/test',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"test": true}',
      });
    });
  });

  describe('requestConfigToCurl', () => {
    it('should convert RequestConfig to curl command', () => {
      const config: RequestConfig = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: '{"name": "John"}',
      };

      const result = requestConfigToCurl(config);

      expect(result).toBe(`curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer token" -d '{"name": "John"}' "https://api.example.com/users"`);
    });

    it('should generate curl for GET request without body', () => {
      const config: RequestConfig = {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token',
        },
      };

      const result = requestConfigToCurl(config);

      expect(result).toBe(`curl -X GET -H "Authorization: Bearer token" "https://api.example.com/users"`);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://api.example.com/users')).toBe(true);
      expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
    });
  });

  describe('formatJsonResponse', () => {
    it('should format valid JSON', () => {
      const json = '{"name":"John","age":30}';
      const result = formatJsonResponse(json);

      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}');
    });

    it('should return original string for invalid JSON', () => {
      const notJson = 'This is not JSON';
      const result = formatJsonResponse(notJson);

      expect(result).toBe('This is not JSON');
    });

    it('should format nested JSON objects', () => {
      const json = '{"user":{"name":"John","details":{"age":30,"city":"NYC"}}}';
      const result = formatJsonResponse(json);

      expect(result).toContain('{\n  "user": {\n    "name": "John",');
      expect(result).toContain('"details": {\n      "age": 30,');
    });
  });
});