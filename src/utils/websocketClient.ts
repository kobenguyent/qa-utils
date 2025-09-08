/**
 * WebSocket Client utility for real-time communication
 */

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  timeout?: number;
}

export interface WebSocketMessage {
  id: string;
  timestamp: number;
  type: 'sent' | 'received' | 'error' | 'connection' | 'disconnection';
  data: string;
  status?: 'connecting' | 'open' | 'closing' | 'closed';
}

export interface WebSocketResponse {
  messages: WebSocketMessage[];
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';
  error?: string;
  lastActivity: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messages: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private onUpdate?: (response: WebSocketResponse) => void;
  private onMessage?: (message: WebSocketMessage) => void;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      throw new Error('WebSocket is already connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.addMessage('connection', `Connecting to ${this.config.url}...`, 'connecting');
        
        this.ws = new WebSocket(this.config.url, this.config.protocols);

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.timeout);

        this.ws.onopen = (_event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this.reconnectAttempts = 0;
          this.addMessage('connection', 'Connected successfully', 'open');
          this.notifyUpdate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = this.addMessage('received', event.data);
          if (this.onMessage) {
            this.onMessage(message);
          }
          this.notifyUpdate();
        };

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          this.addMessage('disconnection', 
            `Connection closed: ${event.code} ${event.reason || 'Unknown reason'}`, 
            'closed'
          );
          this.notifyUpdate();

          if (this.config.autoReconnect && 
              this.reconnectAttempts < (this.config.maxReconnectAttempts || 5) && 
              !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (_event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          const errorMessage = 'WebSocket connection error';
          this.addMessage('error', errorMessage);
          this.notifyUpdate();
          
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(new Error(errorMessage));
          }
        };

      } catch (error) {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        reject(error);
      }
    });
  }

  /**
   * Send message to WebSocket server
   */
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(message);
    this.addMessage('sent', message);
    this.notifyUpdate();
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  /**
   * Get current response state
   */
  getResponse(): WebSocketResponse {
    return {
      messages: [...this.messages],
      connectionState: this.getConnectionState(),
      lastActivity: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : Date.now(),
    };
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
    this.notifyUpdate();
  }

  /**
   * Set update callback
   */
  onUpdateCallback(callback: (response: WebSocketResponse) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set message callback
   */
  onMessageCallback(callback: (message: WebSocketMessage) => void): void {
    this.onMessage = callback;
  }

  private addMessage(type: WebSocketMessage['type'], data: string, status?: WebSocketMessage['status']): WebSocketMessage {
    const message: WebSocketMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      data,
      status,
    };

    this.messages.push(message);
    
    // Limit message history to prevent memory issues
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-500);
    }

    return message;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.addMessage('connection', 
      `Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${this.config.reconnectInterval}ms...`
    );
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will be handled by onclose event
      });
    }, this.config.reconnectInterval);
  }

  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getResponse());
    }
  }

  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Validate WebSocket URL format
 */
export const isValidWebSocketUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
};

/**
 * Format WebSocket message for display
 */
export const formatWebSocketMessage = (message: WebSocketMessage): string => {
  const timestamp = new Date(message.timestamp).toLocaleTimeString();
  const prefix = `[${timestamp}] ${message.type.toUpperCase()}:`;
  
  try {
    // Try to format as JSON if possible
    const parsed = JSON.parse(message.data);
    return `${prefix}\n${JSON.stringify(parsed, null, 2)}`;
  } catch {
    // Return as-is if not JSON
    return `${prefix} ${message.data}`;
  }
};

/**
 * Create WebSocket client instance
 */
export const createWebSocketClient = (config: WebSocketConfig): WebSocketClient => {
  return new WebSocketClient(config);
};