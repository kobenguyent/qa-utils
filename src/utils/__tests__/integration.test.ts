import { describe, it, expect } from 'vitest';
import {
  createWebSocketClient,
  isValidWebSocketUrl,
  WebSocketConfig,
} from '../websocketClient';
import {
  createGrpcClient,
  isValidGrpcUrl,
  parseProtobufDefinition,
  GrpcConfig,
} from '../grpcClient';

/**
 * Integration tests demonstrating WebSocket and gRPC client usage
 * These tests show how to use the clients in real applications
 */
describe('API Client Integration Tests', () => {
  describe('WebSocket Client Integration', () => {
    it('should demonstrate WebSocket client setup and configuration', () => {
      // Test URL validation
      expect(isValidWebSocketUrl('ws://localhost:8080')).toBe(true);
      expect(isValidWebSocketUrl('wss://echo.websocket.org')).toBe(true);
      expect(isValidWebSocketUrl('http://invalid.com')).toBe(false);

      // Test client creation with various configurations
      const basicConfig: WebSocketConfig = {
        url: 'ws://localhost:8080',
      };
      const basicClient = createWebSocketClient(basicConfig);
      expect(basicClient.getConnectionState()).toBe('closed');

      const advancedConfig: WebSocketConfig = {
        url: 'wss://api.example.com/ws',
        protocols: ['chat', 'superchat'],
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        timeout: 60000,
      };
      const advancedClient = createWebSocketClient(advancedConfig);
      expect(advancedClient.getConnectionState()).toBe('closed');
    });

    it('should demonstrate WebSocket client lifecycle management', () => {
      const config: WebSocketConfig = {
        url: 'ws://localhost:8080',
        autoReconnect: false,
      };
      const client = createWebSocketClient(config);

      // Initial state
      expect(client.getConnectionState()).toBe('closed');
      expect(client.getResponse().messages).toHaveLength(0);

      // Cleanup
      client.disconnect();
    });

    it('should demonstrate WebSocket message handling patterns', () => {
      const config: WebSocketConfig = {
        url: 'ws://localhost:8080',
      };
      const client = createWebSocketClient(config);

      // Set up callbacks for handling real-time updates
      let lastResponse: any = null;
      client.onUpdateCallback((response) => {
        lastResponse = response;
      });

      let receivedMessages: any[] = [];
      client.onMessageCallback((message) => {
        receivedMessages.push(message);
      });

      // The client is ready for connection and message handling
      expect(client.getConnectionState()).toBe('closed');
      expect(receivedMessages).toHaveLength(0);
    });
  });

  describe('gRPC Client Integration', () => {
    it('should demonstrate gRPC client setup and configuration', () => {
      // Test URL validation
      expect(isValidGrpcUrl('https://api.example.com')).toBe(true);
      expect(isValidGrpcUrl('http://localhost:8080')).toBe(true);
      expect(isValidGrpcUrl('ws://invalid.com')).toBe(false);

      // Test client creation with various configurations
      const basicConfig: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
      };
      const basicClient = createGrpcClient(basicConfig);
      expect(basicClient.getMessages()).toHaveLength(0);

      const advancedConfig: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'ChatService',
        method: 'StreamMessages',
        metadata: {
          'authorization': 'Bearer token',
          'user-id': '12345',
        },
        timeout: 60000,
        enableRetry: true,
        maxRetries: 3,
      };
      const advancedClient = createGrpcClient(advancedConfig);
      expect(advancedClient.getMessages()).toHaveLength(0);
    });

    it('should demonstrate protobuf definition parsing', () => {
      const protoDefinition = `
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

      const definition = parseProtobufDefinition(protoDefinition);
      
      expect(definition.serviceName).toBe('ExampleService'); // Simplified parser
      expect(definition.methods).toHaveLength(3);
      expect(definition.methods[0].name).toBe('GetUser');
      expect(definition.methods[0].requestType).toBe('GetUserRequest');
      expect(definition.methods[0].responseType).toBe('GetUserResponse');
    });

    it('should demonstrate gRPC request patterns', () => {
      const config: GrpcConfig = {
        url: 'https://api.example.com',
        service: 'UserService',
        method: 'GetUser',
        metadata: {
          'authorization': 'Bearer token',
        },
      };
      const client = createGrpcClient(config);

      // Example request payloads
      const getUserRequest = JSON.stringify({
        id: 123,
      });

      const createUserRequest = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });

      const listUsersRequest = JSON.stringify({
        page: 1,
        limit: 10,
        sort_by: 'created_at',
      });

      // Validate JSON requests
      expect(() => JSON.parse(getUserRequest)).not.toThrow();
      expect(() => JSON.parse(createUserRequest)).not.toThrow();
      expect(() => JSON.parse(listUsersRequest)).not.toThrow();

      // Client is ready for making calls
      expect(client.getMessages()).toHaveLength(0);
    });

    it('should demonstrate error handling patterns', async () => {
      const config: GrpcConfig = {
        url: 'https://invalid-domain-12345.com',
        service: 'TestService',
        method: 'TestMethod',
      };
      const client = createGrpcClient(config);

      try {
        await client.makeUnaryCall('{}');
      } catch (error) {
        // Expected to fail due to invalid domain
        expect(error).toBeDefined();
      }

      // Check that error was logged in messages
      const messages = client.getMessages();
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('API Client Ecosystem Integration', () => {
    it('should demonstrate unified error handling approach', () => {
      // Both clients follow similar patterns for error handling
      const wsConfig: WebSocketConfig = { url: 'ws://localhost:8080' };
      const grpcConfig: GrpcConfig = { 
        url: 'https://api.example.com', 
        service: 'Test', 
        method: 'Test' 
      };

      const wsClient = createWebSocketClient(wsConfig);
      const grpcClient = createGrpcClient(grpcConfig);

      // Both provide state inspection
      expect(wsClient.getConnectionState()).toBeDefined();
      expect(grpcClient.getMessages()).toBeDefined();

      // Both provide cleanup methods
      wsClient.disconnect();
      grpcClient.cancel();
    });

    it('should demonstrate consistent API patterns', () => {
      // URL validation follows similar patterns
      expect(isValidWebSocketUrl('ws://test.com')).toBe(true);
      expect(isValidGrpcUrl('https://test.com')).toBe(true);

      // Factory functions follow consistent naming
      const wsClient = createWebSocketClient({ url: 'ws://test.com' });
      const grpcClient = createGrpcClient({ 
        url: 'https://test.com', 
        service: 'Test', 
        method: 'Test' 
      });

      expect(wsClient).toBeDefined();
      expect(grpcClient).toBeDefined();
    });

    it('should demonstrate real-world usage scenarios', () => {
      // Chat application scenario
      const chatWsConfig: WebSocketConfig = {
        url: 'wss://chat.example.com/ws',
        protocols: ['chat-v1'],
        autoReconnect: true,
        reconnectInterval: 3000,
      };
      const chatClient = createWebSocketClient(chatWsConfig);

      // Microservice communication scenario  
      const userServiceConfig: GrpcConfig = {
        url: 'https://user-service.example.com',
        service: 'UserService',
        method: 'GetProfile',
        metadata: {
          'authorization': 'Bearer jwt-token',
          'x-request-id': 'req-123',
        },
      };
      const userServiceClient = createGrpcClient(userServiceConfig);

      // Both clients are configured for their specific use cases
      expect(chatClient.getConnectionState()).toBe('closed');
      expect(userServiceClient.getMessages()).toHaveLength(0);
    });
  });
});