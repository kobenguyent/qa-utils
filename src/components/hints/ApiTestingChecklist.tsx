import { useState } from "react";
import { Container, Form, Button, Badge } from "react-bootstrap";
import { ChecklistRoom } from "./ChecklistRoom";

export const ApiTestingChecklist = () => {
  const [roomMode, setRoomMode] = useState(false);

  return (
    <Container className="py-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">🌐 API Testing Checklist</h1>
          <p className="lead mb-0">
            A comprehensive checklist for testing REST APIs, GraphQL, and other web services.
          </p>
        </div>
        <Button
          variant={roomMode ? "success" : "outline-secondary"}
          onClick={() => setRoomMode(r => !r)}
          aria-label={roomMode ? "Switch to list mode" : "Switch to room mode"}
        >
          {roomMode ? "🗺️ Room Mode ON" : "🗺️ Room Mode"}
        </Button>
      </div>

      {roomMode && (
        <div className="mb-3 p-3 rounded" style={{ backgroundColor: "var(--info-bg)", color: "var(--info-text)" }}>
          <strong>🏛️ Palace Walk Mode</strong> — Complete each room to mark it visited.{" "}
          <Badge bg="secondary">11 rooms to explore</Badge>
        </div>
      )}

      <ChecklistRoom title="Functional Testing" icon="🧪" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify correct status codes (200, 201, 400, 401, 404, 500, etc.)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with valid request body and parameters" className="mb-2" />
          <Form.Check type="checkbox" label="Test with invalid/missing required fields" className="mb-2" />
          <Form.Check type="checkbox" label="Verify response payload matches expected schema" className="mb-2" />
          <Form.Check type="checkbox" label="Test pagination (limit, offset, page numbers)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify filtering and sorting functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test search endpoints with various queries" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Authentication & Authorization" icon="🔐" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test with valid authentication tokens/credentials" className="mb-2" />
          <Form.Check type="checkbox" label="Test with invalid/expired tokens" className="mb-2" />
          <Form.Check type="checkbox" label="Test with missing authentication headers" className="mb-2" />
          <Form.Check type="checkbox" label="Verify role-based access control (RBAC)" className="mb-2" />
          <Form.Check type="checkbox" label="Test OAuth 2.0/JWT token flows" className="mb-2" />
          <Form.Check type="checkbox" label="Verify refresh token functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test API key validation" className="mb-2" />
          <Form.Check type="checkbox" label="Check unauthorized access attempts" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Data Validation" icon="✅" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test with boundary values (min/max)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with special characters and Unicode" className="mb-2" />
          <Form.Check type="checkbox" label="Verify date and time format validation" className="mb-2" />
          <Form.Check type="checkbox" label="Test with empty strings and null values" className="mb-2" />
          <Form.Check type="checkbox" label="Verify email, URL, and phone number format validation" className="mb-2" />
          <Form.Check type="checkbox" label="Test numeric field validations (integers, decimals)" className="mb-2" />
          <Form.Check type="checkbox" label="Check string length constraints" className="mb-2" />
          <Form.Check type="checkbox" label="Verify enum/allowed values validation" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test for SQL injection vulnerabilities" className="mb-2" />
          <Form.Check type="checkbox" label="Check for XSS in API responses" className="mb-2" />
          <Form.Check type="checkbox" label="Verify HTTPS/TLS encryption" className="mb-2" />
          <Form.Check type="checkbox" label="Test rate limiting and throttling" className="mb-2" />
          <Form.Check type="checkbox" label="Check for CORS policy configuration" className="mb-2" />
          <Form.Check type="checkbox" label="Verify sensitive data is not exposed in responses" className="mb-2" />
          <Form.Check type="checkbox" label="Test for mass assignment vulnerabilities" className="mb-2" />
          <Form.Check type="checkbox" label="Check security headers (CSP, HSTS, X-Frame-Options)" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Performance Testing" icon="⚡" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test response time (should be under 200ms for simple queries)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify Time to First Byte (TTFB)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with large payload sizes" className="mb-2" />
          <Form.Check type="checkbox" label="Perform load testing with multiple concurrent users" className="mb-2" />
          <Form.Check type="checkbox" label="Test API behavior under high traffic (stress testing)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify caching mechanisms (ETag, Cache-Control)" className="mb-2" />
          <Form.Check type="checkbox" label="Test timeout configurations" className="mb-2" />
          <Form.Check type="checkbox" label="Monitor memory and CPU usage" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Request & Response Validation" icon="📋" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify Content-Type header (application/json, etc.)" className="mb-2" />
          <Form.Check type="checkbox" label="Check Accept header handling" className="mb-2" />
          <Form.Check type="checkbox" label="Test with different Content-Type values" className="mb-2" />
          <Form.Check type="checkbox" label="Verify response headers (CORS, caching, etc.)" className="mb-2" />
          <Form.Check type="checkbox" label="Test gzip/compression support" className="mb-2" />
          <Form.Check type="checkbox" label="Verify JSON schema validation" className="mb-2" />
          <Form.Check type="checkbox" label="Check response body structure and data types" className="mb-2" />
          <Form.Check type="checkbox" label="Test multipart/form-data for file uploads" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Error Handling" icon="🐛" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test with malformed JSON in request body" className="mb-2" />
          <Form.Check type="checkbox" label="Verify error messages are user-friendly" className="mb-2" />
          <Form.Check type="checkbox" label="Check error response format consistency" className="mb-2" />
          <Form.Check type="checkbox" label="Test 400 Bad Request scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Test 401 Unauthorized scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Test 403 Forbidden scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Test 404 Not Found scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Test 500 Internal Server Error handling" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Integration Testing" icon="🔄" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test API with database connections" className="mb-2" />
          <Form.Check type="checkbox" label="Verify third-party API integrations" className="mb-2" />
          <Form.Check type="checkbox" label="Test message queue integrations" className="mb-2" />
          <Form.Check type="checkbox" label="Verify webhook functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test event-driven architecture flows" className="mb-2" />
          <Form.Check type="checkbox" label="Check microservices communication" className="mb-2" />
          <Form.Check type="checkbox" label="Test API gateway and routing" className="mb-2" />
          <Form.Check type="checkbox" label="Verify service discovery mechanisms" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Documentation Testing" icon="📝" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify API documentation is accurate (Swagger/OpenAPI)" className="mb-2" />
          <Form.Check type="checkbox" label="Test all examples in documentation" className="mb-2" />
          <Form.Check type="checkbox" label="Check parameter descriptions match actual behavior" className="mb-2" />
          <Form.Check type="checkbox" label="Verify response schema in docs matches actual responses" className="mb-2" />
          <Form.Check type="checkbox" label="Test code samples provided in documentation" className="mb-2" />
          <Form.Check type="checkbox" label="Check that deprecated endpoints are documented" className="mb-2" />
          <Form.Check type="checkbox" label="Verify versioning information is clear" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="GraphQL Specific Tests (if applicable)" icon="🔍" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test query with various field selections" className="mb-2" />
          <Form.Check type="checkbox" label="Test mutations with valid/invalid inputs" className="mb-2" />
          <Form.Check type="checkbox" label="Verify subscription functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test query complexity and depth limiting" className="mb-2" />
          <Form.Check type="checkbox" label="Check for N+1 query problems" className="mb-2" />
          <Form.Check type="checkbox" label="Test with fragments and aliases" className="mb-2" />
          <Form.Check type="checkbox" label="Verify introspection query results" className="mb-2" />
          <Form.Check type="checkbox" label="Test batching and caching strategies" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Final Checks" icon="✅" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Run automated API tests in CI/CD pipeline" className="mb-2" />
          <Form.Check type="checkbox" label="Verify API versioning strategy" className="mb-2" />
          <Form.Check type="checkbox" label="Check backward compatibility" className="mb-2" />
          <Form.Check type="checkbox" label="Test API monitoring and logging" className="mb-2" />
          <Form.Check type="checkbox" label="Verify health check endpoints" className="mb-2" />
          <Form.Check type="checkbox" label="Test API with mock servers" className="mb-2" />
          <Form.Check type="checkbox" label="Check API contract testing" className="mb-2" />
          <Form.Check type="checkbox" label="Verify database transactions and rollbacks" className="mb-2" />
        </Form>
      </ChecklistRoom>
    </Container>
  );
};
