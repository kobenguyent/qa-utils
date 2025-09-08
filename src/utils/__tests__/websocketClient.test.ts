import { describe, it, expect } from 'vitest';
import {
  isValidWebSocketUrl,
  formatWebSocketMessage,
  createWebSocketClient,
  WebSocketConfig,
} from '../websocketClient';

describe('websocketClient utilities', () => {
  describe('isValidWebSocketUrl', () => {
    it('should return true for valid WebSocket URLs', () => {
      expect(isValidWebSocketUrl('ws://localhost:8080')).toBe(true);
      expect(isValidWebSocketUrl('wss://api.example.com/ws')).toBe(true);
      expect(isValidWebSocketUrl('ws://127.0.0.1:3000/chat')).toBe(true);
    });

    it('should return false for invalid WebSocket URLs', () => {
      expect(isValidWebSocketUrl('http://example.com')).toBe(false);
      expect(isValidWebSocketUrl('https://example.com')).toBe(false);
      expect(isValidWebSocketUrl('ftp://example.com')).toBe(false);
      expect(isValidWebSocketUrl('not-a-url')).toBe(false);
      expect(isValidWebSocketUrl('')).toBe(false);
    });
  });

  describe('formatWebSocketMessage', () => {
    it('should format JSON messages', () => {
      const message = {
        id: 'test_1',
        timestamp: new Date('2023-01-01T12:00:00Z').getTime(),
        type: 'received' as const,
        data: '{"type": "greeting", "message": "Hello"}',
      };

      const formatted = formatWebSocketMessage(message);

      expect(formatted).toContain('RECEIVED:');
      expect(formatted).toContain('12:00:00');
      expect(formatted).toContain('"type": "greeting"');
      expect(formatted).toContain('"message": "Hello"');
    });

    it('should format non-JSON messages', () => {
      const message = {
        id: 'test_2',
        timestamp: new Date('2023-01-01T12:00:00Z').getTime(),
        type: 'sent' as const,
        data: 'Plain text message',
      };

      const formatted = formatWebSocketMessage(message);

      expect(formatted).toContain('SENT:');
      expect(formatted).toContain('12:00:00');
      expect(formatted).toContain('Plain text message');
    });

    it('should handle different message types', () => {
      const types = ['sent', 'received', 'error', 'connection', 'disconnection'] as const;
      
      types.forEach(type => {
        const message = {
          id: `test_${type}`,
          timestamp: Date.now(),
          type,
          data: 'Test data',
        };

        const formatted = formatWebSocketMessage(message);
        expect(formatted).toContain(type.toUpperCase());
      });
    });
  });

  describe('createWebSocketClient', () => {
    it('should create WebSocketClient instance', () => {
      const config: WebSocketConfig = { url: 'ws://localhost:8080' };
      const client = createWebSocketClient(config);

      expect(client).toBeDefined();
    });

    it('should pass config to WebSocketClient', () => {
      const config: WebSocketConfig = {
        url: 'wss://api.example.com/ws',
        protocols: ['test'],
        autoReconnect: false,
      };
      
      const client = createWebSocketClient(config);

      expect(client).toBeDefined();
      expect(client.getConnectionState()).toBe('closed');
    });
  });
});