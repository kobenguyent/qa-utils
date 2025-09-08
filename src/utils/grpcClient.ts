/**
 * gRPC Client utility for making gRPC calls via gRPC-Web
 */

export interface GrpcConfig {
  url: string;
  service: string;
  method: string;
  metadata?: Record<string, string>;
  timeout?: number;
  enableRetry?: boolean;
  maxRetries?: number;
}

export interface GrpcMessage {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error' | 'stream';
  data: string;
  duration?: number;
  status?: number;
  statusText?: string;
  metadata?: Record<string, string>;
}

export interface GrpcResponse {
  messages: GrpcMessage[];
  status: number;
  statusText: string;
  metadata: Record<string, string>;
  duration: number;
  error?: string;
}

export interface ProtobufDefinition {
  serviceName: string;
  methods: {
    name: string;
    requestType: string;
    responseType: string;
    streaming: 'none' | 'client' | 'server' | 'bidirectional';
  }[];
}

/**
 * Basic gRPC-Web client implementation
 * Note: This is a simplified implementation for demonstration.
 * In a real application, you would use @grpc/grpc-js or grpc-web library.
 */
export class GrpcClient {
  private config: GrpcConfig;
  private messages: GrpcMessage[] = [];
  private abortController: AbortController | null = null;

  constructor(config: GrpcConfig) {
    this.config = {
      timeout: 30000,
      enableRetry: false,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Make a unary gRPC call
   */
  async makeUnaryCall(request: string): Promise<GrpcResponse> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      // Add request message
      this.addMessage('request', request);

      // Create gRPC-Web compatible request
      const grpcRequest = this.createGrpcWebRequest(request);

      // Make HTTP/2 request to gRPC-Web proxy
      const response = await fetch(this.getGrpcWebUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
          ...this.getMetadataHeaders(),
        },
        body: grpcRequest,
        signal: this.abortController.signal,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`gRPC call failed: ${response.status} ${response.statusText}`);
      }

      // Parse gRPC-Web response
      const responseData = await this.parseGrpcWebResponse(response);
      
      // Add response message
      this.addMessage('response', responseData, duration, response.status, response.statusText);

      return {
        messages: [...this.messages],
        status: response.status,
        statusText: response.statusText,
        metadata: this.extractMetadata(response.headers),
        duration,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.name === 'AbortError' ? 'Request cancelled' : error.message;
      
      this.addMessage('error', errorMessage, duration);

      return {
        messages: [...this.messages],
        status: 0,
        statusText: 'Error',
        metadata: {},
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Make a streaming gRPC call (simplified implementation)
   */
  async makeStreamingCall(
    request: string,
    onMessage: (message: GrpcMessage) => void
  ): Promise<GrpcResponse> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      this.addMessage('request', request);

      // For demonstration, we'll simulate streaming with Server-Sent Events
      const response = await fetch(this.getGrpcWebStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'text/event-stream',
          ...this.getMetadataHeaders(),
        },
        body: this.createGrpcWebRequest(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`gRPC streaming call failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      await this.handleStreamingResponse(response, onMessage);

      const duration = Date.now() - startTime;

      return {
        messages: [...this.messages],
        status: response.status,
        statusText: response.statusText,
        metadata: this.extractMetadata(response.headers),
        duration,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.name === 'AbortError' ? 'Stream cancelled' : error.message;
      
      this.addMessage('error', errorMessage, duration);

      return {
        messages: [...this.messages],
        status: 0,
        statusText: 'Error',
        metadata: {},
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Get current messages
   */
  getMessages(): GrpcMessage[] {
    return [...this.messages];
  }

  private createGrpcWebRequest(data: string): Uint8Array {
    // Simplified gRPC-Web message encoding
    // In a real implementation, this would use protobuf encoding
    const message = new TextEncoder().encode(data);
    const length = message.length;
    
    // gRPC-Web frame: [compression_flag:1][length:4][message:length]
    const frame = new Uint8Array(5 + length);
    frame[0] = 0; // No compression
    frame[1] = (length >>> 24) & 0xff;
    frame[2] = (length >>> 16) & 0xff;
    frame[3] = (length >>> 8) & 0xff;
    frame[4] = length & 0xff;
    frame.set(message, 5);
    
    return frame;
  }

  private async parseGrpcWebResponse(response: Response): Promise<string> {
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    if (data.length < 5) {
      throw new Error('Invalid gRPC-Web response: too short');
    }
    
    // Skip compression flag at data[0] - unused in simplified implementation
    const length = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4];
    
    if (data.length < 5 + length) {
      throw new Error('Invalid gRPC-Web response: incomplete message');
    }
    
    const message = data.slice(5, 5 + length);
    return new TextDecoder().decode(message);
  }

  private async handleStreamingResponse(
    response: Response,
    onMessage: (message: GrpcMessage) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            const message = this.addMessage('stream', data);
            onMessage(message);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private getGrpcWebUrl(): string {
    const baseUrl = this.config.url.replace(/\/$/, '');
    return `${baseUrl}/${this.config.service}/${this.config.method}`;
  }

  private getGrpcWebStreamUrl(): string {
    const baseUrl = this.config.url.replace(/\/$/, '');
    return `${baseUrl}/${this.config.service}/${this.config.method}/stream`;
  }

  private getMetadataHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.metadata) {
      for (const [key, value] of Object.entries(this.config.metadata)) {
        headers[`grpc-${key}`] = value;
      }
    }
    
    return headers;
  }

  private extractMetadata(headers: Headers): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    for (const [key, value] of headers.entries()) {
      if (key.startsWith('grpc-')) {
        metadata[key.slice(5)] = value;
      }
    }
    
    return metadata;
  }

  private addMessage(
    type: GrpcMessage['type'],
    data: string,
    duration?: number,
    status?: number,
    statusText?: string
  ): GrpcMessage {
    const message: GrpcMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      data,
      duration,
      status,
      statusText,
    };

    this.messages.push(message);
    
    // Limit message history
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-500);
    }

    return message;
  }

  private generateId(): string {
    return `grpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Validate gRPC URL format
 */
export const isValidGrpcUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Format gRPC message for display
 */
export const formatGrpcMessage = (message: GrpcMessage): string => {
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
 * Parse protobuf definition from text
 */
export const parseProtobufDefinition = (protoText: string): ProtobufDefinition => {
  // Simplified protobuf parser for demonstration
  // In a real implementation, you would use @grpc/proto-loader
  
  const lines = protoText.split('\n').map(line => line.trim());
  const serviceName = 'ExampleService'; // Extract from proto
  const methods: ProtobufDefinition['methods'] = [];
  
  let inService = false;
  
  for (const line of lines) {
    if (line.startsWith('service ')) {
      inService = true;
      continue;
    }
    
    if (inService && line === '}') {
      break;
    }
    
    if (inService && line.startsWith('rpc ')) {
      // Parse: rpc MethodName(RequestType) returns (ResponseType);
      const match = line.match(/rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(\w+)\s*\)/);
      if (match) {
        methods.push({
          name: match[1],
          requestType: match[2],
          responseType: match[3],
          streaming: 'none', // Simplified
        });
      }
    }
  }
  
  return { serviceName, methods };
};

/**
 * Create gRPC client instance
 */
export const createGrpcClient = (config: GrpcConfig): GrpcClient => {
  return new GrpcClient(config);
};