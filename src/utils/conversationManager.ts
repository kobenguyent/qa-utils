/**
 * Conversation Manager for AI Chat
 * Manages multiple chat contexts/conversations with persistence
 */

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  name: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  provider?: string;
  model?: string;
}

export interface ConversationMetadata {
  id: string;
  name: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  provider?: string;
  model?: string;
}

/**
 * Conversation Manager class
 */
export class ConversationManager {
  private storageKey = 'aiChat_conversations';
  private memoryStorage: Record<string, Conversation> = {};
  private useMemoryStorage = false;

  constructor() {
    // Use memory storage if sessionStorage is not available (e.g., in test environments)
    this.useMemoryStorage = typeof window === 'undefined' || !window.sessionStorage;
  }

  /**
   * Get all conversations (metadata only)
   */
  getConversations(): ConversationMetadata[] {
    try {
      const data = this.loadFromStorage();
      return Object.values(data).map(conv => ({
        id: conv.id,
        name: conv.name,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        provider: conv.provider,
        model: conv.model,
      }));
    } catch (error) {
      console.warn('Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Get a specific conversation by ID
   */
  getConversation(id: string): Conversation | null {
    try {
      const data = this.loadFromStorage();
      return data[id] || null;
    } catch (error) {
      console.warn('Error loading conversation:', error);
      return null;
    }
  }

  /**
   * Create a new conversation
   */
  createConversation(name: string, provider?: string, model?: string): Conversation {
    // Use crypto.randomUUID() if available, fallback to a simple UUID generator
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for environments without crypto.randomUUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const conversation: Conversation = {
      id: generateId(),
      name,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      model,
    };

    this.saveConversation(conversation);
    return conversation;
  }

  /**
   * Update a conversation
   */
  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    try {
      const data = this.loadFromStorage();
      const conversation = data[id];
      
      if (!conversation) {
        return null;
      }

      const updated = {
        ...conversation,
        ...updates,
        id: conversation.id, // Prevent ID change
        updatedAt: Date.now(),
      };

      data[id] = updated;
      this.saveToStorage(data);
      return updated;
    } catch (error) {
      console.warn('Error updating conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  addMessage(conversationId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>): Conversation | null {
    try {
      const conversation = this.getConversation(conversationId);
      if (!conversation) {
        return null;
      }

      // Use the same UUID generation method as createConversation
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const newMessage: ConversationMessage = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };

      conversation.messages.push(newMessage);
      return this.updateConversation(conversationId, { messages: conversation.messages });
    } catch (error) {
      console.warn('Error adding message:', error);
      return null;
    }
  }

  /**
   * Delete a conversation
   */
  deleteConversation(id: string): boolean {
    try {
      const data = this.loadFromStorage();
      if (!data[id]) {
        return false;
      }

      delete data[id];
      this.saveToStorage(data);
      return true;
    } catch (error) {
      console.warn('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Rename a conversation
   */
  renameConversation(id: string, newName: string): boolean {
    try {
      const updated = this.updateConversation(id, { name: newName });
      return updated !== null;
    } catch (error) {
      console.warn('Error renaming conversation:', error);
      return false;
    }
  }

  /**
   * Export conversation to JSON
   */
  exportConversation(id: string): string | null {
    try {
      const conversation = this.getConversation(id);
      if (!conversation) {
        return null;
      }

      return JSON.stringify(conversation, null, 2);
    } catch (error) {
      console.warn('Error exporting conversation:', error);
      return null;
    }
  }

  /**
   * Export conversation to Markdown
   */
  exportConversationMarkdown(id: string): string | null {
    try {
      const conversation = this.getConversation(id);
      if (!conversation) {
        return null;
      }

      let markdown = `# ${conversation.name}\n\n`;
      markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      markdown += `**Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      
      if (conversation.provider) {
        markdown += `**Provider:** ${conversation.provider}\n`;
      }
      if (conversation.model) {
        markdown += `**Model:** ${conversation.model}\n`;
      }

      markdown += `\n---\n\n`;

      for (const message of conversation.messages) {
        const role = message.role === 'user' ? '👤 User' : message.role === 'assistant' ? '🤖 Assistant' : '⚙️ System';
        const timestamp = new Date(message.timestamp).toLocaleString();
        
        markdown += `## ${role}\n`;
        markdown += `*${timestamp}*\n\n`;
        markdown += `${message.content}\n\n`;
        markdown += `---\n\n`;
      }

      return markdown;
    } catch (error) {
      console.warn('Error exporting conversation to markdown:', error);
      return null;
    }
  }

  /**
   * Import conversation from JSON
   */
  importConversation(json: string): Conversation | null {
    try {
      const conversation = JSON.parse(json) as Conversation;
      
      // Validate the conversation structure
      if (!conversation.id || !conversation.name || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation format');
      }

      // Generate new ID to avoid conflicts using fallback-safe method
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      conversation.id = generateId();
      conversation.updatedAt = Date.now();

      this.saveConversation(conversation);
      return conversation;
    } catch (error) {
      console.warn('Error importing conversation:', error);
      return null;
    }
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    try {
      if (this.useMemoryStorage) {
        this.memoryStorage = {};
      } else if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn('Error clearing conversations:', error);
    }
  }

  /**
   * Save a conversation
   */
  private saveConversation(conversation: Conversation): void {
    const data = this.loadFromStorage();
    data[conversation.id] = conversation;
    this.saveToStorage(data);
  }

  /**
   * Load conversations from storage
   */
  private loadFromStorage(): Record<string, Conversation> {
    if (this.useMemoryStorage) {
      return this.memoryStorage;
    }

    try {
      const stored = window.sessionStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Error loading from storage:', error);
      return {};
    }
  }

  /**
   * Save conversations to storage
   */
  private saveToStorage(data: Record<string, Conversation>): void {
    if (this.useMemoryStorage) {
      this.memoryStorage = data;
      return;
    }

    try {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to storage:', error);
    }
  }
}

/**
 * Get formatted conversation title
 */
export function getConversationTitle(conversation: ConversationMetadata): string {
  const date = new Date(conversation.createdAt).toLocaleDateString();
  return `${conversation.name} (${conversation.messageCount} messages, ${date})`;
}

/**
 * Download conversation as file
 */
export function downloadConversation(conversation: Conversation, format: 'json' | 'markdown'): void {
  try {
    const manager = new ConversationManager();
    let content: string | null;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = manager.exportConversation(conversation.id);
      filename = `${conversation.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      content = manager.exportConversationMarkdown(conversation.id);
      filename = `${conversation.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
      mimeType = 'text/markdown';
    }

    if (!content) {
      throw new Error('Failed to export conversation');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading conversation:', error);
    throw error;
  }
}
