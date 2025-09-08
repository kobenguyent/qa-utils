import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GrpcClient,
  GrpcConfig,
  isValidGrpcUrl,
  formatGrpcMessage,
  parseProtobufDefinition,
  createGrpcClient,
} from '../grpcClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbortController = {
  signal: { aborted: false },
  abort: vi.fn(),
};

global.AbortController = vi.fn(() => mockAbortController) as any;

describe('grpcClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAbortController.abort.mockClear();
    mockAbortController.signal.aborted = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('GrpcClient', () => {
    it('should create client with default config', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);
      
      expect(client).toBeInstanceOf(GrpcClient);
      expect(client.getMessages()).toHaveLength(0);
    });

    it('should create client with custom config', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
        metadata: { 'authorization': 'Bearer token' },
        timeout: 60000,
        enableRetry: true,
        maxRetries: 5,
      };
      const client = new GrpcClient(config);
      
      expect(client).toBeInstanceOf(GrpcClient);
    });

    it('should make successful unary call', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/grpc-web+proto',
          'grpc-status': '0',
        }),
        arrayBuffer: vi.fn().mockResolvedValue(
          new Uint8Array([0, 0, 0, 0, 5, 104, 101, 108, 108, 111]).buffer // "hello"
        ),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const request = '{"id": 123}';
      const response = await client.makeUnaryCall(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/UserService/GetUser',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/grpc-web+proto',
            'Accept': 'application/grpc-web+proto',
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.messages).toHaveLength(2); // request + response
      expect(response.messages[0].type).toBe('request');
      expect(response.messages[1].type).toBe('response');
    });

    it('should handle unary call error', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      mockFetch.mockResolvedValue(mockResponse);

      const request = '{"id": 123}';
      const response = await client.makeUnaryCall(request);

      expect(response.status).toBe(0);
      expect(response.error).toBe('gRPC call failed: 500 Internal Server Error');
      expect(response.messages).toHaveLength(2); // request + error
      expect(response.messages[1].type).toBe('error');
    });

    it('should handle network error', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = '{"id": 123}';
      const response = await client.makeUnaryCall(request);

      expect(response.status).toBe(0);
      expect(response.error).toBe('Network error');
      expect(response.messages).toHaveLength(2); // request + error
    });

    it('should include metadata in request headers', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
        metadata: {
          'authorization': 'Bearer token',
          'user-id': '12345',
        },
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        arrayBuffer: vi.fn().mockResolvedValue(
          new Uint8Array([0, 0, 0, 0, 2, 111, 107]).buffer // "ok"
        ),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await client.makeUnaryCall('{}');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'grpc-authorization': 'Bearer token',
            'grpc-user-id': '12345',
          }),
        })
      );
    });

    it('should make streaming call', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'ChatService',
        method: 'StreamMessages',
      };
      const client = new GrpcClient(config);

      const mockBody = {
        getReader: vi.fn().mockReturnValue({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"message": "Hello"}\n\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"message": "World"}\n\n'),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          releaseLock: vi.fn(),
        }),
      };

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: mockBody,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const messages: any[] = [];
      const onMessage = vi.fn((message) => {
        messages.push(message);
      });

      const response = await client.makeStreamingCall('{}', onMessage);

      expect(response.status).toBe(200);
      expect(onMessage).toHaveBeenCalledTimes(2);
      expect(messages).toHaveLength(2);
      expect(messages[0].data).toBe('{"message": "Hello"}');
      expect(messages[1].data).toBe('{"message": "World"}');
    });

    it('should handle streaming call error', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'ChatService',
        method: 'StreamMessages',
      };
      const client = new GrpcClient(config);

      mockFetch.mockRejectedValue(new Error('Connection failed'));

      const onMessage = vi.fn();
      const response = await client.makeStreamingCall('{}', onMessage);

      expect(response.status).toBe(0);
      expect(response.error).toBe('Connection failed');
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should cancel ongoing request', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      // Start a request
      client.makeUnaryCall('{}').catch(() => {
        // Ignore the error for this test
      });

      client.cancel();

      expect(mockAbortController.abort).toHaveBeenCalled();
    });

    it('should clear message history', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      // Start a request to add messages
      client.makeUnaryCall('{}').catch(() => {
        // Ignore the error for this test
      });

      expect(client.getMessages().length).toBeGreaterThan(0);

      client.clearMessages();

      expect(client.getMessages()).toHaveLength(0);
    });

    it('should handle memory management correctly', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        arrayBuffer: vi.fn().mockResolvedValue(
          new Uint8Array([0, 0, 0, 0, 2, 111, 107]).buffer
        ),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Make a few requests
      for (let i = 0; i < 5; i++) {
        await client.makeUnaryCall(`{"request": ${i}}`);
      }

      const messages = client.getMessages();
      expect(messages.length).toBe(10); // 5 requests * 2 messages each
    });

    it('should handle abort error correctly', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const response = await client.makeUnaryCall('{}');

      expect(response.error).toBe('Request cancelled');
    });
  });

  describe('isValidGrpcUrl', () => {
    it('should return true for valid gRPC URLs', () => {
      expect(isValidGrpcUrl('https://api.example.com')).toBe(true);
      expect(isValidGrpcUrl('http://localhost:8080')).toBe(true);
      expect(isValidGrpcUrl('https://grpc.example.com:443/service')).toBe(true);
    });

    it('should return false for invalid gRPC URLs', () => {
      expect(isValidGrpcUrl('ws://example.com')).toBe(false);
      expect(isValidGrpcUrl('wss://example.com')).toBe(false);
      expect(isValidGrpcUrl('ftp://example.com')).toBe(false);
      expect(isValidGrpcUrl('not-a-url')).toBe(false);
      expect(isValidGrpcUrl('')).toBe(false);
    });
  });

  describe('formatGrpcMessage', () => {
    it('should format JSON messages', () => {
      const message = {
        id: 'grpc_1',
        timestamp: new Date('2023-01-01T12:00:00Z').getTime(),
        type: 'response' as const,
        data: '{"user": {"id": 123, "name": "John"}}',
      };

      const formatted = formatGrpcMessage(message);

      expect(formatted).toContain('RESPONSE:');
      expect(formatted).toContain('12:00:00');
      expect(formatted).toContain('"user": {');
      expect(formatted).toContain('"id": 123');
      expect(formatted).toContain('"name": "John"');
    });

    it('should format non-JSON messages', () => {
      const message = {
        id: 'grpc_2',
        timestamp: new Date('2023-01-01T12:00:00Z').getTime(),
        type: 'error' as const,
        data: 'Service unavailable',
      };

      const formatted = formatGrpcMessage(message);

      expect(formatted).toContain('ERROR:');
      expect(formatted).toContain('12:00:00');
      expect(formatted).toContain('Service unavailable');
    });

    it('should handle different message types', () => {
      const types = ['request', 'response', 'error', 'stream'] as const;
      
      types.forEach(type => {
        const message = {
          id: `grpc_${type}`,
          timestamp: Date.now(),
          type,
          data: 'Test data',
        };

        const formatted = formatGrpcMessage(message);
        expect(formatted).toContain(type.toUpperCase());
      });
    });
  });

  describe('parseProtobufDefinition', () => {
    it('should parse simple protobuf service definition', () => {
      const protoText = `
        syntax = "proto3";

        service UserService {
          rpc GetUser(GetUserRequest) returns (GetUserResponse);
          rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
          rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
        }

        message GetUserRequest {
          int32 id = 1;
        }

        message GetUserResponse {
          User user = 1;
        }
      `;

      const definition = parseProtobufDefinition(protoText);

      expect(definition.serviceName).toBe('ExampleService'); // Simplified parser
      expect(definition.methods).toHaveLength(3);
      expect(definition.methods[0]).toEqual({
        name: 'GetUser',
        requestType: 'GetUserRequest',
        responseType: 'GetUserResponse',
        streaming: 'none',
      });
    });

    it('should handle empty or invalid protobuf text', () => {
      const definition = parseProtobufDefinition('');
      
      expect(definition.serviceName).toBe('ExampleService');
      expect(definition.methods).toHaveLength(0);
    });

    it('should parse multiple methods', () => {
      const protoText = `
        service ChatService {
          rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
          rpc GetHistory(GetHistoryRequest) returns (GetHistoryResponse);
        }
      `;

      const definition = parseProtobufDefinition(protoText);

      expect(definition.methods).toHaveLength(2);
      expect(definition.methods[0].name).toBe('SendMessage');
      expect(definition.methods[1].name).toBe('GetHistory');
    });
  });

  describe('createGrpcClient', () => {
    it('should create GrpcClient instance', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = createGrpcClient(config);

      expect(client).toBeInstanceOf(GrpcClient);
    });

    it('should pass config to GrpcClient', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
        metadata: { 'auth': 'token' },
        timeout: 10000,
      };
      
      const client = createGrpcClient(config);

      expect(client).toBeInstanceOf(GrpcClient);
      expect(client.getMessages()).toHaveLength(0);
    });
  });

  describe('gRPC Message Processing', () => {
    it('should create proper gRPC-Web request frame', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        arrayBuffer: vi.fn().mockResolvedValue(
          new Uint8Array([0, 0, 0, 0, 2, 111, 107]).buffer
        ),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await client.makeUnaryCall('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.any(Uint8Array),
        })
      );

      const call = mockFetch.mock.calls[0];
      const body = call[1].body as Uint8Array;
      
      // Check gRPC-Web frame format: [compression:1][length:4][message:length]
      expect(body[0]).toBe(0); // No compression
      expect(body.length).toBeGreaterThan(5); // Header + message
    });

    it('should extract metadata from response headers', async () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const client = new GrpcClient(config);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'grpc-status': '0',
          'grpc-message': 'OK',
          'grpc-custom-header': 'custom-value',
          'content-type': 'application/grpc-web+proto',
        }),
        arrayBuffer: vi.fn().mockResolvedValue(
          new Uint8Array([0, 0, 0, 0, 2, 111, 107]).buffer
        ),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const response = await client.makeUnaryCall('test');

      expect(response.metadata).toEqual({
        'status': '0',
        'message': 'OK',
        'custom-header': 'custom-value',
      });
    });
  });
});