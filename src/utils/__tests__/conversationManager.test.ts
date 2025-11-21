import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ConversationManager,
  getConversationTitle,
  type Conversation,
  type ConversationMetadata,
} from '../conversationManager';

describe('ConversationManager', () => {
  let manager: ConversationManager;
  let testConversationId: string;

  beforeEach(() => {
    manager = new ConversationManager();
    manager.clearAll();
    const conversation = manager.createConversation('Test Conversation', 'openai', 'gpt-3.5-turbo');
    testConversationId = conversation.id;
  });

  afterEach(() => {
    manager.clearAll();
  });

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const conversation = manager.createConversation('New Chat');
      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.name).toBe('New Chat');
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should create conversation with provider and model', () => {
      const conversation = manager.createConversation('Test', 'anthropic', 'claude-3');
      expect(conversation.provider).toBe('anthropic');
      expect(conversation.model).toBe('claude-3');
    });
  });

  describe('getConversations', () => {
    it('should return all conversations metadata', () => {
      const conversations = manager.getConversations();
      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations[0]).toHaveProperty('id');
      expect(conversations[0]).toHaveProperty('name');
      expect(conversations[0]).toHaveProperty('messageCount');
    });

    it('should return empty array when no conversations', () => {
      manager.clearAll();
      const conversations = manager.getConversations();
      expect(conversations).toEqual([]);
    });
  });

  describe('getConversation', () => {
    it('should get a specific conversation', () => {
      const conversation = manager.getConversation(testConversationId);
      expect(conversation).toBeDefined();
      expect(conversation?.id).toBe(testConversationId);
    });

    it('should return null for non-existent conversation', () => {
      const conversation = manager.getConversation('non-existent-id');
      expect(conversation).toBeNull();
    });
  });

  describe('updateConversation', () => {
    it('should update conversation properties', () => {
      const updated = manager.updateConversation(testConversationId, {
        name: 'Updated Name',
      });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
    });

    it('should not allow changing conversation ID', () => {
      const originalId = testConversationId;
      const updated = manager.updateConversation(testConversationId, {
        id: 'new-id',
      } as Partial<Conversation>);
      expect(updated?.id).toBe(originalId);
    });

    it('should return null for non-existent conversation', () => {
      const updated = manager.updateConversation('non-existent', { name: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add a message to conversation', () => {
      const result = manager.addMessage(testConversationId, {
        role: 'user',
        content: 'Hello',
      });
      expect(result).toBeDefined();
      expect(result?.messages.length).toBe(1);
      expect(result?.messages[0].content).toBe('Hello');
      expect(result?.messages[0].id).toBeDefined();
      expect(result?.messages[0].timestamp).toBeDefined();
    });

    it('should add multiple messages', () => {
      manager.addMessage(testConversationId, {
        role: 'user',
        content: 'Hello',
      });
      manager.addMessage(testConversationId, {
        role: 'assistant',
        content: 'Hi there!',
      });
      const conversation = manager.getConversation(testConversationId);
      expect(conversation?.messages.length).toBe(2);
    });

    it('should return null for non-existent conversation', () => {
      const result = manager.addMessage('non-existent', {
        role: 'user',
        content: 'Test',
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', () => {
      const deleted = manager.deleteConversation(testConversationId);
      expect(deleted).toBe(true);
      const conversation = manager.getConversation(testConversationId);
      expect(conversation).toBeNull();
    });

    it('should return false for non-existent conversation', () => {
      const deleted = manager.deleteConversation('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('renameConversation', () => {
    it('should rename a conversation', () => {
      const renamed = manager.renameConversation(testConversationId, 'New Name');
      expect(renamed).toBe(true);
      const conversation = manager.getConversation(testConversationId);
      expect(conversation?.name).toBe('New Name');
    });

    it('should return false for non-existent conversation', () => {
      const renamed = manager.renameConversation('non-existent', 'Name');
      expect(renamed).toBe(false);
    });
  });

  describe('exportConversation', () => {
    it('should export conversation as JSON', () => {
      manager.addMessage(testConversationId, {
        role: 'user',
        content: 'Test message',
      });
      const json = manager.exportConversation(testConversationId);
      expect(json).toBeDefined();
      const parsed = JSON.parse(json as string);
      expect(parsed.id).toBe(testConversationId);
      expect(parsed.messages.length).toBe(1);
    });

    it('should return null for non-existent conversation', () => {
      const json = manager.exportConversation('non-existent');
      expect(json).toBeNull();
    });
  });

  describe('exportConversationMarkdown', () => {
    it('should export conversation as Markdown', () => {
      manager.addMessage(testConversationId, {
        role: 'user',
        content: 'Hello',
      });
      manager.addMessage(testConversationId, {
        role: 'assistant',
        content: 'Hi there!',
      });
      const markdown = manager.exportConversationMarkdown(testConversationId);
      expect(markdown).toBeDefined();
      expect(markdown).toContain('# Test Conversation');
      expect(markdown).toContain('👤 User');
      expect(markdown).toContain('🤖 Assistant');
      expect(markdown).toContain('Hello');
      expect(markdown).toContain('Hi there!');
    });

    it('should include provider and model in export', () => {
      const markdown = manager.exportConversationMarkdown(testConversationId);
      expect(markdown).toContain('**Provider:** openai');
      expect(markdown).toContain('**Model:** gpt-3.5-turbo');
    });

    it('should return null for non-existent conversation', () => {
      const markdown = manager.exportConversationMarkdown('non-existent');
      expect(markdown).toBeNull();
    });
  });

  describe('importConversation', () => {
    it('should import conversation from JSON', () => {
      const original = manager.getConversation(testConversationId);
      const json = manager.exportConversation(testConversationId) as string;
      manager.clearAll();
      
      const imported = manager.importConversation(json);
      expect(imported).toBeDefined();
      expect(imported?.name).toBe(original?.name);
      expect(imported?.id).not.toBe(original?.id); // New ID should be generated
    });

    it('should return null for invalid JSON', () => {
      const imported = manager.importConversation('invalid json');
      expect(imported).toBeNull();
    });

    it('should return null for invalid conversation format', () => {
      const imported = manager.importConversation('{"invalid": "format"}');
      expect(imported).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all conversations', () => {
      manager.createConversation('Chat 1');
      manager.createConversation('Chat 2');
      expect(manager.getConversations().length).toBeGreaterThan(0);
      
      manager.clearAll();
      expect(manager.getConversations()).toEqual([]);
    });
  });
});

describe('getConversationTitle', () => {
  it('should format conversation title', () => {
    const metadata: ConversationMetadata = {
      id: '123',
      name: 'Test Chat',
      messageCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const title = getConversationTitle(metadata);
    expect(title).toContain('Test Chat');
    expect(title).toContain('5 messages');
  });
});
