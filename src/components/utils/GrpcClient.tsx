import React, { useState } from 'react';
import { Button, Container, Form, Row, Col, Alert, Badge, Card, Tab, Tabs } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  GrpcClient,
  GrpcConfig,
  GrpcMessage,
  GrpcResponse,
  isValidGrpcUrl,
  formatGrpcMessage,
  parseProtobufDefinition,
  createGrpcClient,
} from '../../utils/grpcClient';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

interface RequestHistory {
  id: string;
  config: GrpcConfig;
  request: string;
  response?: GrpcResponse;
  error?: string;
  timestamp: number;
}

interface UIGrpcConfig {
  url: string;
  service: string;
  method: string;
  metadata: string; // UI state as string
  timeout: number;
}

export const GrpcClientComponent: React.FC = () => {
  const [config, setConfig] = useState<UIGrpcConfig>({
    url: 'https://api.example.com',
    service: 'UserService',
    method: 'GetUser',
    metadata: '',
    timeout: 30000,
  });

  const [request, setRequest] = useState('{\n  "id": 123\n}');
  const [protoDefinition, setProtoDefinition] = useState('');
  const [response, setResponse] = useState<GrpcResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [client, setClient] = useState<GrpcClient | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<GrpcMessage[]>([]);
  const ai = useAIAssistant();

  // Parse metadata from textarea
  const parseMetadata = (metadataText: string): Record<string, string> => {
    const metadata: Record<string, string> = {};
    metadataText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    });
    return metadata;
  };

  // Format metadata for display
  const formatMetadata = (metadata: Record<string, string>): string => {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const handleUnaryCall = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse(null);

      if (!isValidGrpcUrl(config.url)) {
        setError('Please enter a valid gRPC URL (http:// or https://)');
        return;
      }

      if (!config.service.trim() || !config.method.trim()) {
        setError('Service and Method names are required');
        return;
      }

      if (!request.trim()) {
        setError('Request body is required');
        return;
      }

      // Validate JSON request
      try {
        JSON.parse(request);
      } catch {
        setError('Request must be valid JSON');
        return;
      }

      const grpcConfig: GrpcConfig = {
        url: config.url,
        service: config.service,
        method: config.method,
        metadata: parseMetadata(config.metadata),
        timeout: config.timeout,
      };

      const grpcClient = createGrpcClient(grpcConfig);
      setClient(grpcClient);

      const result = await grpcClient.makeUnaryCall(request);
      setResponse(result);

      // Add to history
      const historyEntry: RequestHistory = {
        id: `req_${Date.now()}`,
        config: grpcConfig,
        request,
        response: result,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err: any) {
      const errorMsg = err.message || 'gRPC call failed';
      setError(errorMsg);
      
      // Add error to history
      const historyEntry: RequestHistory = {
        id: `req_${Date.now()}`,
        config: {
          url: config.url,
          service: config.service,
          method: config.method,
          metadata: parseMetadata(config.metadata),
          timeout: config.timeout,
        },
        request,
        error: errorMsg,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingCall = async () => {
    try {
      setLoading(true);
      setError('');
      setStreamingMessages([]);

      if (!isValidGrpcUrl(config.url)) {
        setError('Please enter a valid gRPC URL (http:// or https://)');
        return;
      }

      if (!config.service.trim() || !config.method.trim()) {
        setError('Service and Method names are required');
        return;
      }

      // Validate JSON request
      try {
        JSON.parse(request);
      } catch {
        setError('Request must be valid JSON');
        return;
      }

      const grpcConfig: GrpcConfig = {
        url: config.url,
        service: config.service,
        method: config.method,
        metadata: parseMetadata(config.metadata),
        timeout: config.timeout,
      };

      const grpcClient = createGrpcClient(grpcConfig);
      setClient(grpcClient);

      const onMessage = (message: GrpcMessage) => {
        setStreamingMessages(prev => [...prev, message]);
      };

      const result = await grpcClient.makeStreamingCall(request, onMessage);
      setResponse(result);

    } catch (err: any) {
      setError(err.message || 'gRPC streaming call failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (client) {
      client.cancel();
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: RequestHistory) => {
    setConfig({
      url: entry.config.url,
      service: entry.config.service,
      method: entry.config.method,
      metadata: formatMetadata(entry.config.metadata || {}),
      timeout: entry.config.timeout || 30000,
    });
    setRequest(entry.request);
    setResponse(entry.response || null);
    setError(entry.error || '');
  };

  const parseProtoFile = () => {
    if (!protoDefinition.trim()) {
      setError('Please enter a protobuf definition');
      return;
    }

    try {
      const definition = parseProtobufDefinition(protoDefinition);
      setConfig(prev => ({
        ...prev,
        service: definition.serviceName,
        method: definition.methods[0]?.name || '',
      }));
      setError('');
    } catch (err: any) {
      setError(`Failed to parse protobuf: ${err.message}`);
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 0) return <Badge bg="danger">No Response</Badge>;
    if (status >= 200 && status < 300) return <Badge bg="success">{status}</Badge>;
    if (status >= 400) return <Badge bg="danger">{status}</Badge>;
    return <Badge bg="warning">{status}</Badge>;
  };

  const getMessageBadge = (type: GrpcMessage['type']) => {
    switch (type) {
      case 'request': return <Badge bg="primary">REQUEST</Badge>;
      case 'response': return <Badge bg="success">RESPONSE</Badge>;
      case 'error': return <Badge bg="danger">ERROR</Badge>;
      case 'stream': return <Badge bg="info">STREAM</Badge>;
      default: return <Badge bg="secondary">{String(type).toUpperCase()}</Badge>;
    }
  };

  return (
    <Container fluid className="mt-3">      <div className="text-center mb-4">
        <h1>⚡ gRPC Client</h1>
        <p className="text-muted">Test gRPC services with gRPC-Web support</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'manual')}
        className="mb-4"
      >
        <Tab eventKey="manual" title="Manual Configuration">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">gRPC Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>gRPC Server URL *</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.url}
                      onChange={(e) => setConfig({ ...config, url: e.target.value })}
                      placeholder="https://api.example.com"
                    />
                    <Form.Text className="text-muted">
                      gRPC-Web endpoint URL (http:// or https://)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.service}
                      onChange={(e) => setConfig({ ...config, service: e.target.value })}
                      placeholder="UserService"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Method Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={config.method}
                      onChange={(e) => setConfig({ ...config, method: e.target.value })}
                      placeholder="GetUser"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Metadata (one per line: key: value)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={config.metadata}
                      onChange={(e) => setConfig({ ...config, metadata: e.target.value })}
                      placeholder={`authorization: Bearer token\nuser-id: 12345\ncontent-type: application/grpc`}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timeout (ms)</Form.Label>
                    <Form.Control
                      type="number"
                      value={config.timeout}
                      onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Request</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Request Body (JSON) *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder={`{
  "id": 123,
  "name": "John Doe"
}`}
                />
                <Form.Text className="text-muted">
                  JSON representation of the protobuf message
                </Form.Text>
                {ai.isConfigured ? (
                  <AIAssistButton
                    label="Generate Request Body"
                    onClick={async () => {
                      try {
                        const response = await ai.sendRequest(
                          'You are a gRPC expert. Generate a JSON request body for the given gRPC service and method. Return ONLY the JSON without any explanation or markdown formatting.',
                          `Generate a gRPC JSON request body for service "${config.service}", method "${config.method}". ${protoDefinition ? `Proto definition:\n${protoDefinition}` : 'Generate a reasonable sample request.'}`
                        );
                        setRequest(response);
                      } catch {
                        // error displayed by AIAssistButton
                      }
                    }}
                    isLoading={ai.isLoading}
                    error={ai.error}
                    onClear={ai.clear}
                    className="mt-2"
                  />
                ) : (
                  <AIConfigureHint className="mt-2" />
                )}
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleUnaryCall}
                  disabled={loading}
                >
                  {loading ? 'Calling...' : 'Unary Call'}
                </Button>
                <Button
                  variant="info"
                  onClick={handleStreamingCall}
                  disabled={loading}
                >
                  {loading ? 'Streaming...' : 'Streaming Call'}
                </Button>
                {loading && (
                  <Button variant="outline-danger" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="proto" title="Protobuf Definition">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Parse Protobuf Definition</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Protobuf Definition (.proto file content)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={12}
                  value={protoDefinition}
                  onChange={(e) => setProtoDefinition(e.target.value)}
                  placeholder={`syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}

message GetUserRequest {
  int32 id = 1;
}

message GetUserResponse {
  User user = 1;
}`}
                />
              </Form.Group>
              <Button variant="primary" onClick={parseProtoFile}>
                Parse & Configure
              </Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Response */}
      {response && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Response</h5>
              {getStatusBadge(response.status)}
              <span className="ms-2 text-muted">
                Duration: {response.duration}ms
              </span>
            </div>
            <CopyWithToast
              text={JSON.stringify(response, null, 2)}
            />
          </Card.Header>
          <Card.Body>
            <Tabs defaultActiveKey="messages" className="mb-3">
              <Tab eventKey="messages" title="Messages">
                {response.messages.map((message) => (
                  <div key={message.id} className="mb-3 border-bottom pb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        {getMessageBadge(message.type)}
                        <span className="ms-2 text-muted small">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.duration && (
                          <span className="ms-2 text-muted small">
                            ({message.duration}ms)
                          </span>
                        )}
                      </div>
                      <CopyWithToast
                        text={formatGrpcMessage(message)}
                      />
                    </div>
                    <pre className="theme-code-block p-2 rounded small">
                      <code>{message.data}</code>
                    </pre>
                  </div>
                ))}
              </Tab>
              <Tab eventKey="metadata" title="Response Metadata">
                <pre className="bg-light p-2 rounded">
                  <code>
                    {Object.entries(response.metadata)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n') || 'No metadata'}
                  </code>
                </pre>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}

      {/* Streaming Messages */}
      {streamingMessages.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Streaming Messages ({streamingMessages.length})</h5>
          </Card.Header>
          <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {streamingMessages.map((message) => (
              <div key={message.id} className="mb-2 p-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  {getMessageBadge(message.type)}
                  <span className="text-muted small">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="theme-code-block p-1 rounded small mb-0">
                  <code>{message.data}</code>
                </pre>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Request History */}
      {history.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Request History</h5>
          </Card.Header>
          <Card.Body>
            {history.map((entry) => (
              <div key={entry.id} className="mb-2 p-2 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    {entry.error ? (
                      <Badge bg="danger">ERROR</Badge>
                    ) : (
                      getStatusBadge(entry.response?.status || 0)
                    )}
                    <span className="ms-2 fw-bold">
                      {entry.config.service}.{entry.config.method}
                    </span>
                    <span className="ms-2 text-muted">{entry.config.url}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => loadFromHistory(entry)}
                    >
                      Load
                    </Button>
                    <small className="text-muted align-self-center">
                      {new Date(entry.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}    </Container>
  );
};