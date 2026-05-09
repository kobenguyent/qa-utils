import { useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Tabs, Tab } from 'react-bootstrap';

// ─── Data ─────────────────────────────────────────────────────────────────────

const API_TYPES = [
  {
    id: 'rest',
    icon: '🌐',
    name: 'REST',
    full: 'Representational State Transfer',
    color: '#34d399',
    badge: 'Architectural Style',
    year: '2000',
    author: 'Roy Fielding',
    definition:
      'REST is an architectural style for distributed hypermedia systems. It uses standard HTTP methods (GET, POST, PUT, PATCH, DELETE) and is stateless — each request from a client contains all the information needed to fulfil it. Resources are identified by URLs and representations are transferred (usually JSON or XML).',
    principles: [
      'Stateless — no client session stored on server',
      'Uniform interface — consistent resource URLs',
      'Client–server separation',
      'Cacheable responses',
      'Layered system architecture',
      'Optional code on demand',
    ],
    strengths: [
      'Simple and widely understood',
      'Excellent tooling and ecosystem',
      'Native HTTP caching',
      'Human-readable URLs',
      'Works with any HTTP client',
    ],
    weaknesses: [
      'Over/under-fetching of data',
      'Multiple round trips for related data',
      'No real-time support natively',
      'Versioning can be complex',
    ],
    useCases: [
      'Public APIs (Twitter, GitHub, Stripe)',
      'Mobile backends',
      'Microservices communication',
      'CRUD web applications',
      'Third-party integrations',
    ],
    example: `GET /api/users/42
Authorization: Bearer token

HTTP/1.1 200 OK
{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com"
}`,
    tools: ['Postman', 'Insomnia', 'HTTPie', 'curl', 'REST Client (this tool)'],
  },
  {
    id: 'graphql',
    icon: '⬡',
    name: 'GraphQL',
    full: 'Graph Query Language',
    color: '#e879f9',
    badge: 'Query Language',
    year: '2015',
    author: 'Facebook (Meta)',
    definition:
      'GraphQL is a query language for APIs and a runtime for executing those queries. Unlike REST, the client specifies exactly what data it needs in a single request — no more over-fetching or under-fetching. A strongly typed schema defines the entire API surface. Supports queries (read), mutations (write), and subscriptions (real-time).',
    principles: [
      'Hierarchical — queries mirror the data shape',
      'Strongly typed schema (SDL)',
      'Client-specified queries',
      'Single endpoint (/graphql)',
      'Introspectable — schema self-documenting',
      'Version-free evolution',
    ],
    strengths: [
      'Fetch exactly the data you need',
      'Single request for nested/related data',
      'Self-documenting via introspection',
      'Real-time via subscriptions',
      'Strongly typed — catch errors early',
    ],
    weaknesses: [
      'Complexity for simple CRUD',
      'HTTP caching is harder',
      'N+1 query problem (needs DataLoader)',
      'Steeper learning curve',
      'File uploads are non-trivial',
    ],
    useCases: [
      'Complex product UIs (Facebook, GitHub, Shopify)',
      'Mobile apps needing minimal data',
      'Aggregating multiple microservices',
      'Rapid frontend iteration',
      'Collaborative real-time apps',
    ],
    example: `POST /graphql
Content-Type: application/json

{
  "query": "query { user(id: 42) { name email posts { title } } }"
}

{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [{ "title": "Hello World" }]
    }
  }
}`,
    tools: ['GraphQL Client (this tool)', 'GraphiQL', 'Apollo Studio', 'Altair', 'Insomnia'],
  },
  {
    id: 'grpc',
    icon: '⚡',
    name: 'gRPC',
    full: 'Google Remote Procedure Call',
    color: '#60a5fa',
    badge: 'RPC Framework',
    year: '2015',
    author: 'Google',
    definition:
      'gRPC is a high-performance, open-source RPC (Remote Procedure Call) framework that uses HTTP/2 for transport, Protocol Buffers (protobuf) as the interface description language, and provides features such as authentication, bidirectional streaming, flow control, blocking/non-blocking bindings, and cancellation. It generates client and server stubs in many languages from a .proto definition.',
    principles: [
      'Contract-first via .proto IDL',
      'HTTP/2 multiplexing',
      'Binary serialisation (protobuf)',
      'Four call types: unary, server-streaming, client-streaming, bidirectional',
      'Language-agnostic code generation',
      'Built-in TLS and auth',
    ],
    strengths: [
      '~7–10× faster than REST/JSON',
      'Strongly typed contracts',
      'Bidirectional streaming',
      'Efficient binary protocol',
      'Automatic code generation for 11+ languages',
    ],
    weaknesses: [
      'Not human-readable (binary)',
      'Limited browser support (needs gRPC-Web proxy)',
      'Protobuf schema management overhead',
      'Harder to debug without tooling',
      'Less familiarity in web teams',
    ],
    useCases: [
      'Internal microservices communication',
      'Low-latency financial/trading systems',
      'IoT device communication',
      'Streaming media pipelines',
      'ML model inference servers',
    ],
    example: `// user.proto
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc StreamUsers (Empty) returns (stream User);
}
message GetUserRequest { int32 id = 1; }
message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
}`,
    tools: ['gRPC Client (this tool)', 'grpcurl', 'Postman', 'BloomRPC', 'Evans'],
  },
  {
    id: 'websocket',
    icon: '🔌',
    name: 'WebSocket',
    full: 'WebSocket Protocol (RFC 6455)',
    color: '#fb923c',
    badge: 'Bidirectional Protocol',
    year: '2011',
    author: 'IETF',
    definition:
      'WebSocket provides a full-duplex communication channel over a single TCP connection. After an HTTP upgrade handshake, the connection stays open and both client and server can push messages at any time without polling. Ideal for real-time applications where latency matters and server-initiated events are required.',
    principles: [
      'Persistent TCP connection (no re-connection overhead)',
      'Full-duplex (simultaneous send/receive)',
      'Framing protocol with opcodes',
      'Initiated via HTTP Upgrade handshake',
      'Subprotocols (e.g., STOMP, MQTT over WS)',
    ],
    strengths: [
      'True real-time (sub-millisecond latency)',
      'Server can push data without client request',
      'Low overhead after handshake',
      'Wide browser support',
      'Works through most firewalls/proxies',
    ],
    weaknesses: [
      'Stateful — harder to scale horizontally',
      'No built-in request/response semantics',
      'No native HTTP caching or CDN support',
      'Connection management complexity',
      'Overkill for infrequent updates',
    ],
    useCases: [
      'Live chat & messaging (Slack, Discord)',
      'Real-time dashboards and monitoring',
      'Multiplayer games',
      'Collaborative editing (Figma, Notion)',
      'Live stock/crypto price feeds',
    ],
    example: `// Client connects once:
const ws = new WebSocket('wss://api.example.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.send(JSON.stringify({ type: 'subscribe', channel: 'prices' }));

// Server pushes whenever data changes — no polling needed`,
    tools: ['WebSocket Client (this tool)', 'wscat', 'Postman', 'websocat', 'Insomnia'],
  },
  {
    id: 'soap',
    icon: '🧼',
    name: 'SOAP',
    full: 'Simple Object Access Protocol',
    color: '#94a3b8',
    badge: 'Protocol',
    year: '1998',
    author: 'Microsoft / W3C',
    definition:
      'SOAP is a protocol (not just a style) for exchanging structured information over a computer network using XML. It defines a strict message format with an envelope, headers, and body. Services are described by WSDL (Web Services Description Language). SOAP supports WS-Security, WS-Transactions and other enterprise-grade extensions.',
    principles: [
      'XML-based envelope format',
      'WSDL contract (machine-readable)',
      'Transport-agnostic (HTTP, SMTP, TCP)',
      'WS-* standards for security/transactions',
      'Strict error handling via fault elements',
    ],
    strengths: [
      'Enterprise-grade security (WS-Security)',
      'ACID-compliant transactions (WS-AtomicTransaction)',
      'Formal contract via WSDL',
      'Language and transport agnostic',
      'Still common in banking, healthcare, government',
    ],
    weaknesses: [
      'Extremely verbose XML',
      'Slow serialisation/deserialisation',
      'Complex tooling required',
      'Steep learning curve',
      'Poor developer experience vs REST/GraphQL',
    ],
    useCases: [
      'Banking and financial services',
      'Healthcare (HL7, FHIR legacy)',
      'Government/enterprise integrations',
      'Payment gateway APIs (some)',
      'Legacy enterprise systems (SAP, Salesforce)',
    ],
    example: `POST /UserService HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "GetUser"

<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetUser xmlns="https://example.com/">
      <userId>42</userId>
    </GetUser>
  </soap:Body>
</soap:Envelope>`,
    tools: ['SoapUI', 'Postman', 'curl', 'Wireshark', 'Apache JMeter'],
  },
  {
    id: 'sse',
    icon: '📡',
    name: 'SSE',
    full: 'Server-Sent Events',
    color: '#fbbf24',
    badge: 'HTTP Streaming',
    year: '2004',
    author: 'Opera / WHATWG',
    definition:
      'Server-Sent Events is a server-push technology enabling a client to receive automatic updates from a server over a single long-lived HTTP connection. Unlike WebSockets it is one-directional (server → client only) and uses the plain text/event-stream content type. Natively supported by the browser EventSource API with automatic reconnection.',
    principles: [
      'Unidirectional: server → client only',
      'Standard HTTP (works with proxies/CDNs)',
      'Automatic reconnection built in',
      'Named event types',
      'Event IDs for resuming streams',
    ],
    strengths: [
      'Simple — just HTTP, no special protocol',
      'Native browser support (EventSource)',
      'Automatic reconnect & last-event-id',
      'HTTP/2 server push compatible',
      'Works through all HTTP proxies',
    ],
    weaknesses: [
      'Server → client only (no client push)',
      'Limited browser connections (6 per domain on HTTP/1.1)',
      'Text-only (no binary frames like WebSocket)',
      'Not suitable for bidirectional communication',
    ],
    useCases: [
      'Live news/social feeds',
      'AI streaming responses (OpenAI, Claude)',
      'Real-time notifications',
      'Progress updates for long-running tasks',
      'Live sports scores',
    ],
    example: `// Server streams events:
// Content-Type: text/event-stream

id: 1
event: price-update
data: {"symbol":"AAPL","price":192.45}

id: 2
event: price-update
data: {"symbol":"TSLA","price":256.10}

// Client:
const es = new EventSource('/api/stream');
es.addEventListener('price-update', e => {
  console.log(JSON.parse(e.data));
});`,
    tools: ['curl', 'Browser DevTools', 'Postman', 'HTTPie', 'EventSource API'],
  },
  {
    id: 'webhook',
    icon: '🪝',
    name: 'Webhook',
    full: 'HTTP Callback / Reverse API',
    color: '#f472b6',
    badge: 'Event-Driven Pattern',
    year: '2007',
    author: 'Jeff Lindsay',
    definition:
      'A Webhook is a user-defined HTTP callback triggered by an event in a source system. Instead of polling an API repeatedly, you register a URL and the provider POSTs a JSON payload to it whenever the event occurs. Also called "reverse APIs" — the server calls you instead of you calling the server.',
    principles: [
      'Event-driven: push over pull',
      'Standard HTTP POST to a user URL',
      'Signed payloads for verification (HMAC)',
      'Delivery semantics: at-least-once',
      'Retry logic with exponential backoff',
    ],
    strengths: [
      'Real-time without polling',
      'Simple to implement (any HTTP server)',
      'Decoupled systems',
      'Reduces API quota usage',
      'Works across the internet',
    ],
    weaknesses: [
      'Requires a public HTTPS endpoint',
      'Must handle retries & idempotency',
      'Ordering not guaranteed',
      'Debugging requires tools like ngrok',
      'No built-in acknowledgement protocol',
    ],
    useCases: [
      'Payment notifications (Stripe, PayPal)',
      'CI/CD triggers (GitHub, GitLab webhooks)',
      'CRM event sync (HubSpot, Salesforce)',
      'E-commerce order events (Shopify)',
      'IoT device state changes',
    ],
    example: `// Provider POSTs to your URL:
POST https://yourapp.com/webhooks/stripe
Stripe-Signature: t=...,v1=...
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount": 2000,
      "currency": "usd"
    }
  }
}

// Verify signature, process, return 200`,
    tools: ['ngrok', 'Svix', 'Hookdeck', 'webhook.site', 'Postman'],
  },
  {
    id: 'mqtt',
    icon: '📶',
    name: 'MQTT',
    full: 'Message Queuing Telemetry Transport',
    color: '#a78bfa',
    badge: 'Pub/Sub Protocol',
    year: '1999',
    author: 'IBM / Andy Stanford-Clark',
    definition:
      'MQTT is a lightweight, publish-subscribe messaging protocol designed for constrained devices and low-bandwidth, high-latency networks (IoT). Devices publish messages to topics on a broker; other devices subscribe to those topics and receive messages. Three QoS levels ensure delivery guarantees from fire-and-forget to exactly-once.',
    principles: [
      'Publish-Subscribe pattern via a broker',
      'Topics (hierarchical, e.g. sensors/room1/temp)',
      'Three QoS levels (0, 1, 2)',
      'Retained messages (broker stores last value)',
      'Last Will and Testament (LWT) for disconnect detection',
      'Persistent sessions',
    ],
    strengths: [
      'Extremely lightweight (2-byte header)',
      'Works on unreliable networks',
      'Many-to-many fan-out',
      'Offline clients via QoS 1/2',
      'Designed for battery-powered devices',
    ],
    weaknesses: [
      'Requires a broker (Mosquitto, EMQX)',
      'No request/reply semantics natively',
      'Message ordering not guaranteed across topics',
      'Security configuration can be complex',
    ],
    useCases: [
      'IoT sensor data collection',
      'Smart home automation (Home Assistant)',
      'Industrial control systems (SCADA)',
      'Autonomous vehicles telemetry',
      'Mobile push notifications (Facebook Messenger)',
    ],
    example: `// Publisher (temperature sensor):
client.publish('home/bedroom/temperature', '22.5', { qos: 1 });

// Subscriber (dashboard):
client.subscribe('home/+/temperature');
client.on('message', (topic, message) => {
  // topic: 'home/bedroom/temperature'
  // message: Buffer('22.5')
  updateDashboard(topic, parseFloat(message.toString()));
});`,
    tools: ['MQTT Explorer', 'MQTTX', 'mosquitto_pub/sub', 'HiveMQ', 'Postman (MQTT)'],
  },
];

const COMPARISON_ROWS = [
  { aspect: 'Protocol', rest: 'HTTP/1.1, HTTP/2', graphql: 'HTTP/1.1, HTTP/2', grpc: 'HTTP/2', websocket: 'TCP (WS)', soap: 'HTTP, SMTP, TCP', sse: 'HTTP', webhook: 'HTTPS', mqtt: 'TCP/TLS' },
  { aspect: 'Data Format', rest: 'JSON, XML, text', graphql: 'JSON', grpc: 'Protobuf (binary)', websocket: 'Any (text/binary)', soap: 'XML', sse: 'Plain text', webhook: 'JSON, XML', mqtt: 'Any (binary)' },
  { aspect: 'Communication', rest: 'Request/Response', graphql: 'Request/Response + Subscriptions', grpc: 'Unary + Streaming', websocket: 'Full-duplex', soap: 'Request/Response', sse: 'Server → Client', webhook: 'Server → Client (push)', mqtt: 'Pub/Sub' },
  { aspect: 'Real-time', rest: '❌ (polling only)', graphql: '✅ (subscriptions)', grpc: '✅ (streaming)', websocket: '✅ (native)', soap: '❌', sse: '✅ (one-way)', webhook: '✅ (event-driven)', mqtt: '✅ (native)' },
  { aspect: 'Caching', rest: '✅ (HTTP cache)', graphql: '⚠️ (complex)', grpc: '⚠️ (limited)', websocket: '❌', soap: '⚠️ (limited)', sse: '✅ (HTTP)', webhook: '❌', mqtt: '✅ (retained)' },
  { aspect: 'Browser Support', rest: '✅ Native', graphql: '✅ Native', grpc: '⚠️ (gRPC-Web proxy)', websocket: '✅ Native', soap: '⚠️ (needs CORS)', sse: '✅ EventSource', webhook: '✅ (server-side)', mqtt: '✅ (MQTT over WS)' },
  { aspect: 'Type Safety', rest: '⚠️ (OpenAPI opt-in)', graphql: '✅ (SDL schema)', grpc: '✅ (protobuf)', websocket: '❌ (DIY)', soap: '✅ (WSDL)', sse: '❌', webhook: '❌ (DIY)', mqtt: '❌' },
  { aspect: 'Learning Curve', rest: '🟢 Low', graphql: '🟡 Medium', grpc: '🔴 High', websocket: '🟡 Medium', soap: '🔴 High', sse: '🟢 Low', webhook: '🟢 Low', mqtt: '🟡 Medium' },
  { aspect: 'Performance', rest: '⭐⭐⭐', graphql: '⭐⭐⭐', grpc: '⭐⭐⭐⭐⭐', websocket: '⭐⭐⭐⭐', soap: '⭐', sse: '⭐⭐⭐⭐', webhook: '⭐⭐⭐', mqtt: '⭐⭐⭐⭐⭐' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const ApiTypesGuide = () => {
  const [selected, setSelected] = useState(API_TYPES[0].id);
  const current = API_TYPES.find((t) => t.id === selected) ?? API_TYPES[0];

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🔌</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">API Types — Definitions &amp; Applications</h1>
          <p className="tool-header-desc">
            A comprehensive guide to every major API paradigm: what they are, how they work, when to use them, and how they compare.
          </p>
        </div>
      </div>

      <Tabs defaultActiveKey="explorer" className="mb-4">

        {/* ── Explorer tab ── */}
        <Tab eventKey="explorer" title="🔍 API Explorer">
          <Row className="g-3">
            {/* Left sidebar — API type selector */}
            <Col xs={12} md={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {API_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: selected === t.id
                        ? `1.5px solid ${t.color}`
                        : '1.5px solid var(--border-color)',
                      background: selected === t.id ? `${t.color}14` : 'var(--bg-secondary)',
                      color: selected === t.id ? t.color : 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: selected === t.id ? 700 : 400,
                      fontSize: '0.88rem',
                      transition: 'all 0.15s',
                    }}
                    aria-pressed={selected === t.id}
                    aria-label={`View ${t.name} details`}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 400, color: 'var(--muted)' }}>
                        {t.badge}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Col>

            {/* Right pane — detail */}
            <Col xs={12} md={9}>
              <Card style={{ border: `1px solid ${current.color}33`, background: 'var(--bg-secondary)' }}>
                <Card.Header style={{ background: `${current.color}14`, borderBottom: `1px solid ${current.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.8rem' }}>{current.icon}</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: current.color }}>
                        {current.name}
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{current.full}</div>
                    </div>
                    <Badge style={{ background: current.color, color: '#fff', fontSize: '0.72rem', marginLeft: 'auto' }}>
                      {current.badge}
                    </Badge>
                    <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                      Since {current.year}
                    </Badge>
                    <Badge bg="dark" style={{ fontSize: '0.7rem' }}>
                      by {current.author}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Definition */}
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)', marginBottom: '1.25rem' }}>
                    {current.definition}
                  </p>

                  <Row className="g-3 mb-3">
                    {/* Key principles */}
                    <Col xs={12} md={4}>
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '0.85rem', border: '1px solid var(--border-color)', height: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.6rem', color: current.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🔑 Core Principles
                        </div>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)' }}>
                          {current.principles.map((p) => <li key={p}>{p}</li>)}
                        </ul>
                      </div>
                    </Col>

                    {/* Strengths */}
                    <Col xs={12} md={4}>
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '0.85rem', border: '1px solid #34d39933', height: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.6rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          ✅ Strengths
                        </div>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)' }}>
                          {current.strengths.map((s) => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    </Col>

                    {/* Weaknesses */}
                    <Col xs={12} md={4}>
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '0.85rem', border: '1px solid #f8717133', height: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.6rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          ⚠️ Weaknesses
                        </div>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)' }}>
                          {current.weaknesses.map((w) => <li key={w}>{w}</li>)}
                        </ul>
                      </div>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    {/* Use cases */}
                    <Col xs={12} md={6}>
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '0.85rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.6rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🚀 Use Cases
                        </div>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)' }}>
                          {current.useCases.map((u) => <li key={u}>{u}</li>)}
                        </ul>
                      </div>
                    </Col>

                    {/* Code example */}
                    <Col xs={12} md={6}>
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden', height: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.6rem 0.85rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-color)' }}>
                          💡 Example
                        </div>
                        <pre style={{ margin: 0, padding: '0.75rem 0.85rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: 'var(--text)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--code-bg)' }}>
                          {current.example}
                        </pre>
                      </div>
                    </Col>
                  </Row>

                  {/* Tools */}
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>🛠 Tools:</span>
                    {current.tools.map((tool) => (
                      <Badge
                        key={tool}
                        style={{
                          background: `${current.color}18`,
                          color: current.color,
                          border: `1px solid ${current.color}44`,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                        }}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* ── Comparison tab ── */}
        <Tab eventKey="comparison" title="⚖️ Comparison Table">
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">⚖️ API Types Side-by-Side Comparison</h3>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <Table striped bordered hover responsive style={{ marginBottom: 0, fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '130px', background: 'var(--bg-secondary)' }}>Aspect</th>
                      {API_TYPES.map((t) => (
                        <th key={t.id} style={{ minWidth: '120px', color: t.color, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {t.icon} {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.aspect}>
                        <td style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', background: 'var(--bg-secondary)' }}>
                          {row.aspect}
                        </td>
                        {API_TYPES.map((t) => (
                          <td key={t.id} style={{ textAlign: 'center', color: 'var(--text)', verticalAlign: 'middle' }}>
                            {row[t.id as keyof typeof row]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        {/* ── Decision guide tab ── */}
        <Tab eventKey="decision" title="🧭 Which API to Use?">
          <Row className="g-3">
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                  <h3 className="h5 mb-0">🌐 REST — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li>Building a <strong>public API</strong> with external consumers</li>
                    <li>Team is familiar with HTTP and wants simplicity</li>
                    <li>HTTP <strong>caching</strong> is important (CDN, browser)</li>
                    <li>Resources map naturally to URLs (CRUD operations)</li>
                    <li>Consumers are diverse (browser, mobile, CLI)</li>
                    <li>You need <strong>discoverability</strong> via hypermedia links</li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>Examples:</strong> GitHub API, Stripe API, Twitter/X API, AWS APIs
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header style={{ background: '#7c3aed', color: '#fff' }}>
                  <h3 className="h5 mb-0">⬡ GraphQL — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li>Frontend teams need <strong>flexible queries</strong> without backend changes</li>
                    <li>Mobile apps must minimise data payload (bandwidth)</li>
                    <li>Multiple clients need different shapes from the same API</li>
                    <li>You're aggregating data from <strong>multiple microservices</strong></li>
                    <li>Real-time updates are needed (subscriptions)</li>
                    <li>Rapid product iteration with evolving UI requirements</li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>Examples:</strong> GitHub v4, Shopify Storefront, Meta, Netflix
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-info text-white">
                  <h3 className="h5 mb-0">⚡ gRPC — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li><strong>Internal microservices</strong> where performance is critical</li>
                    <li>Bidirectional or server-streaming is required</li>
                    <li>Multiple language services must <strong>share a contract</strong></li>
                    <li>Network bandwidth is constrained (binary protobuf)</li>
                    <li>You need built-in code generation for 11+ languages</li>
                    <li>Low-latency real-time data pipelines (ML inference, trading)</li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>Examples:</strong> Google internal services, Netflix, Cloudflare Workers
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-warning text-dark">
                  <h3 className="h5 mb-0">🔌 WebSocket — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li>You need <strong>true real-time, bidirectional</strong> communication</li>
                    <li>Server must push updates <em>without</em> client requests</li>
                    <li>High-frequency updates (games, live charts, collaboration)</li>
                    <li>Latency matters more than simplicity</li>
                    <li>Chat, notifications, or live presence features</li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>Examples:</strong> Slack, Discord, Figma, Binance live prices
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-secondary text-white">
                  <h3 className="h5 mb-0">🧼 SOAP — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li>Integrating with <strong>legacy enterprise</strong> systems requiring SOAP</li>
                    <li>WS-Security / WS-AtomicTransaction compliance is mandatory</li>
                    <li>Banking, healthcare, or government regulations require it</li>
                    <li>Formal WSDL contract is a hard requirement</li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>Examples:</strong> Banking SWIFT integrations, PayPal legacy, HL7 v2, SAP
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100">
                <Card.Header style={{ background: '#d97706', color: '#fff' }}>
                  <h3 className="h5 mb-0">📡 SSE &amp; Webhooks — Choose when…</h3>
                </Card.Header>
                <Card.Body>
                  <ul style={{ lineHeight: 1.8, fontSize: '0.88rem' }}>
                    <li><strong>SSE:</strong> One-way server push over plain HTTP (AI streaming, news feeds, notifications)</li>
                    <li><strong>SSE:</strong> Prefer simplicity over WebSocket when bidirectionality isn't needed</li>
                    <li><strong>Webhook:</strong> You want providers to <em>call you</em> on events (payments, CI triggers)</li>
                    <li><strong>Webhook:</strong> Decoupled event-driven integrations between SaaS products</li>
                    <li><strong>MQTT:</strong> IoT devices on constrained networks needing pub/sub</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* ── Architecture patterns tab ── */}
        <Tab eventKey="patterns" title="🏗 Architecture Patterns">
          <Row className="g-4">
            <Col xs={12}>
              <Card>
                <Card.Header className="bg-dark text-white">
                  <h3 className="h5 mb-0">🏗 Common API Architecture Patterns</h3>
                </Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Pattern</th>
                        <th>Description</th>
                        <th>Typical APIs Used</th>
                        <th>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>🏢 Monolith</strong></td>
                        <td>Single deployable unit exposing a unified API surface</td>
                        <td>REST, GraphQL</td>
                        <td>Early-stage startups, Django/Rails apps</td>
                      </tr>
                      <tr>
                        <td><strong>🧩 Microservices</strong></td>
                        <td>Each service owns its API; communication is service-to-service</td>
                        <td>gRPC (internal), REST (external), Webhooks (events)</td>
                        <td>Netflix, Uber, Amazon</td>
                      </tr>
                      <tr>
                        <td><strong>🚪 API Gateway</strong></td>
                        <td>Single entry point proxying and composing multiple backend services</td>
                        <td>REST + gRPC backends, GraphQL federation</td>
                        <td>AWS API Gateway, Kong, NGINX, Traefik</td>
                      </tr>
                      <tr>
                        <td><strong>📦 BFF (Backend for Frontend)</strong></td>
                        <td>Separate API tailored for each client type (web, mobile, TV)</td>
                        <td>GraphQL, REST</td>
                        <td>SoundCloud, Spotify mobile vs web APIs</td>
                      </tr>
                      <tr>
                        <td><strong>📡 Event-Driven</strong></td>
                        <td>Services communicate asynchronously via events/messages</td>
                        <td>Webhooks, MQTT, SSE, WebSocket, Kafka REST Proxy</td>
                        <td>Stripe payment events, IoT pipelines</td>
                      </tr>
                      <tr>
                        <td><strong>🌐 GraphQL Federation</strong></td>
                        <td>Multiple GraphQL subgraph services composed into a single supergraph</td>
                        <td>GraphQL (Apollo Federation, Hive)</td>
                        <td>Shopify, The New York Times</td>
                      </tr>
                      <tr>
                        <td><strong>🔗 Service Mesh</strong></td>
                        <td>Infrastructure layer handling service-to-service communication (mTLS, retries, circuit breaking)</td>
                        <td>gRPC, REST (sidecar proxy)</td>
                        <td>Istio, Linkerd, Envoy</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12}>
              <Card>
                <Card.Header style={{ background: '#1e40af', color: '#fff' }}>
                  <h3 className="h5 mb-0">📊 API Versioning Strategies</h3>
                </Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Strategy</th>
                        <th>Example</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Used by</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>URI Versioning</strong></td>
                        <td><code>/api/v2/users</code></td>
                        <td>Simple, visible, easy to route</td>
                        <td>URL pollution, not RESTful</td>
                        <td>Twitter, Stripe, GitHub v3</td>
                      </tr>
                      <tr>
                        <td><strong>Header Versioning</strong></td>
                        <td><code>Accept: application/vnd.api+json;version=2</code></td>
                        <td>Clean URLs, flexible</td>
                        <td>Less discoverable, harder to test in browser</td>
                        <td>GitHub v4, Microsoft Graph</td>
                      </tr>
                      <tr>
                        <td><strong>Query Parameter</strong></td>
                        <td><code>/users?version=2</code></td>
                        <td>Easy to test in browser</td>
                        <td>Breaks caching, messy URLs</td>
                        <td>Amazon AWS, Google APIs (some)</td>
                      </tr>
                      <tr>
                        <td><strong>GraphQL Evolution</strong></td>
                        <td>Deprecate fields, add new ones — no versions</td>
                        <td>Continuous evolution, no breaking changes</td>
                        <td>Deprecated fields accumulate, schema size grows</td>
                        <td>GitHub GraphQL, Shopify</td>
                      </tr>
                      <tr>
                        <td><strong>Protobuf Evolution</strong></td>
                        <td>Add fields with new tag numbers, never reuse/remove</td>
                        <td>Binary-compatible, additive changes safe</td>
                        <td>Careful field number management required</td>
                        <td>Google Cloud APIs, gRPC services</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* ── Security tab ── */}
        <Tab eventKey="security" title="🔐 API Security">
          <Row className="g-3">
            <Col xs={12}>
              <Card>
                <Card.Header className="bg-danger text-white">
                  <h3 className="h5 mb-0">🔐 API Authentication Methods</h3>
                </Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>How It Works</th>
                        <th>Strengths</th>
                        <th>Weaknesses</th>
                        <th>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>API Key</strong></td>
                        <td>Static secret in header or query param</td>
                        <td>Simple, no expiry management</td>
                        <td>No identity, hard to rotate, leaked easily</td>
                        <td>Server-to-server, public APIs</td>
                      </tr>
                      <tr>
                        <td><strong>Bearer JWT</strong></td>
                        <td>Signed token contains claims, validated without DB lookup</td>
                        <td>Stateless, self-contained, short-lived</td>
                        <td>Can't revoke before expiry, larger payload</td>
                        <td>User auth, microservices, SPAs</td>
                      </tr>
                      <tr>
                        <td><strong>OAuth 2.0</strong></td>
                        <td>Delegated authorisation via access tokens and scopes</td>
                        <td>Industry standard, scoped permissions, third-party flows</td>
                        <td>Complex flows (4 grant types), token management</td>
                        <td>Third-party integrations, SSO</td>
                      </tr>
                      <tr>
                        <td><strong>OpenID Connect</strong></td>
                        <td>OAuth 2.0 + identity layer (ID token with user claims)</td>
                        <td>Standard identity protocol, works with major IdPs</td>
                        <td>Complexity on top of OAuth 2.0</td>
                        <td>User authentication, federated identity</td>
                      </tr>
                      <tr>
                        <td><strong>mTLS</strong></td>
                        <td>Both parties present and verify TLS certificates</td>
                        <td>Strongest mutual authentication, no token management</td>
                        <td>Certificate management overhead, not browser-native</td>
                        <td>Internal microservices (service mesh), IoT, banking</td>
                      </tr>
                      <tr>
                        <td><strong>HMAC Signature</strong></td>
                        <td>Request signed with shared secret, verified server-side</td>
                        <td>Tamper-evident, replay protection with nonce/timestamp</td>
                        <td>Shared secret management, complexity</td>
                        <td>Webhooks (Stripe, GitHub), server-to-server</td>
                      </tr>
                      <tr>
                        <td><strong>WS-Security</strong></td>
                        <td>XML security tokens, encryption in SOAP envelope</td>
                        <td>End-to-end security, works over any transport</td>
                        <td>Very complex, XML overhead</td>
                        <td>SOAP/enterprise systems, banking</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Card.Header style={{ background: '#7f1d1d', color: '#fff' }}>
                  <h3 className="h5 mb-0">⚠️ OWASP Top API Security Risks</h3>
                </Card.Header>
                <Card.Body>
                  <Table responsive striped bordered hover style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Risk</th>
                        <th>Description</th>
                        <th>Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['API1', 'Broken Object Level Authorization (BOLA)', 'Accessing another user\'s data by changing an ID', 'Validate ownership server-side on every request'],
                        ['API2', 'Broken Authentication', 'Weak tokens, missing expiry, brute-force possible', 'JWT with short expiry, rate-limit auth endpoints, MFA'],
                        ['API3', 'Broken Object Property Level Auth', 'Exposing sensitive fields or mass assignment', 'Explicit allowlists for request/response fields'],
                        ['API4', 'Unrestricted Resource Consumption', 'No rate limiting — DoS via large payloads or queries', 'Rate limiting, query depth/complexity limits (GraphQL)'],
                        ['API5', 'Broken Function Level Authorization', 'Admin endpoints accessible to regular users', 'Role-based access control on every endpoint'],
                        ['API6', 'Unrestricted Access to Sensitive Business Flows', 'Automation of flows (mass account creation, scraping)', 'CAPTCHA, device fingerprinting, anomaly detection'],
                        ['API7', 'Server-Side Request Forgery (SSRF)', 'API fetches attacker-controlled URLs', 'Validate and allowlist URLs, block internal ranges'],
                        ['API8', 'Security Misconfiguration', 'Default creds, open debug endpoints, verbose errors', 'Security hardening, disable debug in prod, scan regularly'],
                        ['API9', 'Improper Inventory Management', 'Forgotten deprecated API versions still running', 'API gateway inventory, sunset deprecated versions'],
                        ['API10', 'Unsafe Consumption of APIs', 'Trusting third-party API data without validation', 'Validate all external API responses, input sanitisation'],
                      ].map(([id, risk, desc, mitigation]) => (
                        <tr key={id}>
                          <td><Badge bg="danger">{id}</Badge></td>
                          <td><strong>{risk}</strong></td>
                          <td style={{ fontSize: '0.8rem' }}>{desc}</td>
                          <td style={{ fontSize: '0.8rem', color: '#34d399' }}>{mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

      </Tabs>
    </Container>
  );
};
