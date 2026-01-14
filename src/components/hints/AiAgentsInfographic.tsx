import { Container, Row, Col, Card } from 'react-bootstrap';

export const AiAgentsInfographic = () => {
  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">AI Agents & MCP Infographic</h1>
      
      <Row className="mb-4">
        <Col>
          <Card className="mb-3">
            <Card.Body>
              <h2 className="h4">What are AI Agents?</h2>
              <p><strong>AI Agents</strong> are autonomous systems that perceive their environment, make decisions, and take actions to achieve specific goals using artificial intelligence.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-primary">
            <Card.Header className="bg-primary text-white">
              <h3 className="h5 mb-0">🤖 AI Agent Architecture</h3>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>1. Perception</strong>
                <p className="mb-2">Receives input from environment (text, data, APIs)</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>2. Reasoning</strong>
                <p className="mb-2">LLM processes and plans actions</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>3. Tool Use</strong>
                <p className="mb-2">Executes functions via MCP or APIs</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div>
                <strong>4. Action</strong>
                <p className="mb-0">Returns results or performs tasks</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success">
            <Card.Header className="bg-success text-white">
              <h3 className="h5 mb-0">🔌 Model Context Protocol (MCP)</h3>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">Open protocol for connecting AI models to external tools and data sources</p>
              <div className="mb-3">
                <strong>MCP Server</strong>
                <p className="mb-2">Exposes tools, resources, and prompts</p>
              </div>
              <div className="mb-3">
                <strong>MCP Client</strong>
                <p className="mb-2">AI application connects to servers</p>
              </div>
              <div>
                <strong>Standardized Interface</strong>
                <p className="mb-0">JSON-RPC 2.0 communication protocol</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h3 className="h5 mb-0">🛠️ MCP Components</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h4 className="h6">🔧 Tools</h4>
                  <p className="small">Functions AI can call (file operations, web search, calculations)</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">📦 Resources</h4>
                  <p className="small">Data sources AI can access (files, databases, APIs)</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">💬 Prompts</h4>
                  <p className="small">Pre-configured prompt templates for common tasks</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">🎯 Agent Types</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <strong>ReAct Agents</strong>
                  <p className="text-muted small">Reason + Act in iterative loops</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Plan-and-Execute</strong>
                  <p className="text-muted small">Plan first, then execute steps</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Reflexion Agents</strong>
                  <p className="text-muted small">Self-reflect and improve</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Multi-Agent</strong>
                  <p className="text-muted small">Multiple agents collaborate</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">🌟 Popular Frameworks</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <strong>LangChain</strong>
                  <p className="text-muted small">Python/JS framework for LLM apps</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>AutoGPT</strong>
                  <p className="text-muted small">Autonomous GPT-4 agent</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>CrewAI</strong>
                  <p className="text-muted small">Multi-agent orchestration</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Semantic Kernel</strong>
                  <p className="text-muted small">Microsoft's AI orchestration</p>
                </Col>
              </Row>
              <Row>
                <Col md={3} className="mb-3">
                  <strong>LlamaIndex</strong>
                  <p className="text-muted small">Data framework for LLMs</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Haystack</strong>
                  <p className="text-muted small">NLP framework by deepset</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Agent Protocol</strong>
                  <p className="text-muted small">Universal agent interface</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Claude Desktop</strong>
                  <p className="text-muted small">Native MCP support</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="border-warning">
            <Card.Header className="bg-warning">
              <h3 className="h5 mb-0">⚡ MCP Use Cases</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ul>
                    <li><strong>File System Access:</strong> Read/write files locally</li>
                    <li><strong>Database Queries:</strong> Connect to SQL/NoSQL databases</li>
                    <li><strong>Web Scraping:</strong> Fetch and parse web content</li>
                    <li><strong>API Integration:</strong> Call external REST/GraphQL APIs</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul>
                    <li><strong>Code Execution:</strong> Run code in sandboxed environments</li>
                    <li><strong>Search Engines:</strong> Web search capabilities</li>
                    <li><strong>Version Control:</strong> Git operations</li>
                    <li><strong>Cloud Services:</strong> AWS, Azure, GCP integration</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h3 className="h5 mb-0">🔒 Security & Best Practices</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h4 className="h6">Security</h4>
                  <ul className="small">
                    <li>Validate all tool inputs</li>
                    <li>Implement rate limiting</li>
                    <li>Use authentication/authorization</li>
                    <li>Sandbox code execution</li>
                    <li>Audit tool usage logs</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h4 className="h6">Best Practices</h4>
                  <ul className="small">
                    <li>Keep tools focused and simple</li>
                    <li>Provide clear tool descriptions</li>
                    <li>Handle errors gracefully</li>
                    <li>Monitor agent performance</li>
                    <li>Version your MCP servers</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">📚 Learn More</h3>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li><strong>MCP Specification:</strong> <code>modelcontextprotocol.io</code></li>
                <li><strong>LangChain Docs:</strong> <code>python.langchain.com</code></li>
                <li><strong>OpenAI Function Calling:</strong> <code>platform.openai.com/docs</code></li>
                <li><strong>Anthropic Claude:</strong> <code>docs.anthropic.com</code></li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
