import React, { useState } from 'react';
import { Button, Container, Form, Row, Col, Alert, Spinner, Tab, Tabs, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  makeRequest,
  curlToRequestConfig,
  requestConfigToCurl,
  isValidUrl,
  formatJsonResponse,
  RequestConfig,
  RestResponse,
} from '../../utils/restClient';

interface RequestHistory {
  id: string;
  config: RequestConfig;
  response?: RestResponse;
  error?: string;
  timestamp: number;
}

interface UIRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  headers: string; // UI state as string
  body: string;
  timeout?: number;
}

export const RestClient: React.FC = () => {
  const [config, setConfig] = useState<UIRequestConfig>({
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headers: '',
    body: '',
  });

  const [curlInput, setCurlInput] = useState('');
  const [response, setResponse] = useState<RestResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('manual');

  // Parse headers from textarea
  const parseHeaders = (headersText: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    headersText.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    });
    return headers;
  };

  // Convert headers to textarea format
  const headersToText = (headers: Record<string, string>): string => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const handleSendRequest = async () => {
    setError('');
    setResponse(null);
    setLoading(true);

    try {
      // Validate URL
      if (!isValidUrl(config.url)) {
        throw new Error('Please enter a valid URL');
      }

      // Parse headers
      const parsedHeaders = parseHeaders(config.headers);

      const requestConfig: RequestConfig = {
        ...config,
        headers: parsedHeaders,
        body: config.body || undefined,
      };

      const result = await makeRequest(requestConfig);
      setResponse(result);

      // Add to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        config: requestConfig,
        response: result,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);

      // Add error to history
      const requestConfig: RequestConfig = {
        url: config.url,
        method: config.method,
        headers: parseHeaders(config.headers),
        body: config.body || undefined,
      };
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        config: requestConfig,
        error: errorMessage,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCurl = () => {
    try {
      if (!curlInput.trim()) {
        setError('Please enter a curl command');
        return;
      }

      const parsedConfig = curlToRequestConfig(curlInput);
      setConfig({
        url: parsedConfig.url,
        method: parsedConfig.method,
        headers: headersToText(parsedConfig.headers || {}),
        body: parsedConfig.body || '',
      });
      setError('');
      setActiveTab('manual'); // Switch to manual tab after import
    } catch (err: any) {
      setError(err.message || 'Failed to parse curl command');
    }
  };

  const loadFromHistory = (item: RequestHistory) => {
    setConfig({
      url: item.config.url,
      method: item.config.method,
      headers: headersToText(item.config.headers || {}),
      body: item.config.body || '',
    });
    setResponse(item.response || null);
    setError(item.error || '');
    setActiveTab('manual');
  };

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    return 'danger';
  };

  return (
    <Container>      <div className="text-center mb-4">
        <h1>🌐 REST Client</h1>
        <p className="text-muted">Make RESTful requests and import curl commands</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'manual')}
        className="mb-3"
      >
        <Tab eventKey="manual" title="Manual Request">
          <Form>
            <Row className="mb-3">
              <Col md={2}>
                <Form.Select
                  value={config.method}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    method: e.target.value as RequestConfig['method'] 
                  }))}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                </Form.Select>
              </Col>
              <Col md={8}>
                <Form.Control
                  type="url"
                  placeholder="https://api.example.com/endpoint"
                  value={config.url}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Button 
                  variant="primary" 
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? <Spinner animation="border" size="sm" /> : 'Send'}
                </Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Headers (one per line, format: key: value)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                  value={config.headers}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    headers: e.target.value 
                  }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Request Body</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder='{"key": "value"}'
                  value={config.body}
                  onChange={(e) => setConfig(prev => ({ ...prev, body: e.target.value }))}
                />
              </Col>
            </Row>
          </Form>
        </Tab>

        <Tab eventKey="curl" title="Import Curl">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Paste your curl command here:</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{&quot;name&quot;: &quot;John&quot;}'"
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
              />
            </Form.Group>
            <Button 
              variant="success" 
              onClick={handleImportCurl}
              className="me-2"
            >
              Import Curl
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => setCurlInput('')}
            >
              Clear
            </Button>
          </Form>
        </Tab>

        <Tab eventKey="history" title={`History (${history.length})`}>
          {history.length === 0 ? (
            <Alert variant="info">No request history yet. Make some requests to see them here!</Alert>
          ) : (
            <div>
              {history.map((item) => (
                <div key={item.id} className="border rounded p-3 mb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{item.config.method}</strong> {item.config.url}
                      <br />
                      <small className="text-muted">
                        {new Date(item.timestamp).toLocaleString()}
                      </small>
                      {item.response && (
                        <div className="mt-1">
                          <Badge bg={getStatusBadgeVariant(item.response.status)}>
                            {item.response.status} {item.response.statusText}
                          </Badge>
                          <small className="text-muted ms-2">
                            {item.response.duration}ms
                          </small>
                        </div>
                      )}
                      {item.error && (
                        <div className="mt-1">
                          <Badge bg="danger">Error</Badge>
                          <small className="text-danger ms-2">{item.error}</small>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => loadFromHistory(item)}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>

      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Export as curl */}
      {(config.url && isValidUrl(config.url)) && (
        <div className="mb-3">
          <h5>Generated Curl Command:</h5>
          <div className="theme-code-block p-2 rounded">
            <code className="text-break">
              {requestConfigToCurl({
                ...config,
                headers: parseHeaders(config.headers)
              })}
            </code>
            <CopyWithToast
              text={requestConfigToCurl({
                ...config,
                headers: parseHeaders(config.headers)
              })}
            />
          </div>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="mb-4">
          <h5>Response</h5>
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <Badge bg={getStatusBadgeVariant(response.status)} className="me-2">
                  {response.status} {response.statusText}
                </Badge>
                <small className="text-muted">Response time: {response.duration}ms</small>
              </div>
              <CopyWithToast
                text={response.data}
              />
            </div>

            <Tabs defaultActiveKey="formatted" className="mb-3">
              <Tab eventKey="formatted" title="Formatted">
                <pre className="theme-code-block p-2 rounded text-wrap" style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <code>{formatJsonResponse(response.data)}</code>
                </pre>
              </Tab>
              <Tab eventKey="raw" title="Raw">
                <pre className="theme-code-block p-2 rounded text-wrap" style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <code>{response.data}</code>
                </pre>
              </Tab>
              <Tab eventKey="headers" title="Response Headers">
                <pre className="theme-code-block p-2 rounded">
                  <code>
                    {Object.entries(response.headers)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')}
                  </code>
                </pre>
              </Tab>
            </Tabs>
          </div>
        </div>
      )}    </Container>
  );
};